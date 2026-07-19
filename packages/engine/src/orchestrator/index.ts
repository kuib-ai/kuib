// @context @journal/architecture-overview
import { streamText, stepCountIs, type LanguageModel } from "ai";

import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";
import Tools from "@kuib-ai/tools";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";

import newID from "#new.id";
import Provider from "#provider";
import buildMessages from "#build.messages";
import type { DaemonClient } from "#daemon.client/transport.factory";
import createDaemonFileSystem from "#daemon.file.system";

type RunAgentParams = {
  prompt: string;
  sessionID: SessionID;
  deviceID: DeviceID;
  model: LanguageModel;
  daemonClient: DaemonClient;
  eventLog: EventLogPort;
  takePending?: () => string[];
};

const runAgent = async function (params: RunAgentParams): Promise<void> {
  const { prompt, sessionID, deviceID, model, daemonClient, eventLog } = params;
  const messageID = newID(Protocol.ID.MessageID);

  await Std.withScope({ sessionID, deviceID, messageID }, async function () {
    const emit = function (event: AnyEvent) {
      return eventLog.append(sessionID, deviceID, event);
    };

    const emitUserMessage = function (text: string) {
      return emit({
        type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
        messageID: newID(Protocol.ID.MessageID),
        parts: [
          {
            type: Protocol.Part.PartTypeEnum.TEXT,
            partID: newID(Protocol.ID.PartID),
            excluded: false,
            text,
          },
        ],
      });
    };

    await emitUserMessage(prompt);

    await emit({
      type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      messageID,
    });

    const fileSystem = createDaemonFileSystem(daemonClient);
    const tools = Provider.buildTools([Tools.readFile, Tools.readDir], {
      fs: fileSystem,
    });

    const messages = buildMessages(eventLog, sessionID);

    const result = streamText({
      model,
      messages,
      tools,
      stopWhen: stepCountIs(5),
      telemetry: { isEnabled: true, functionId: "runAgent" },
      providerOptions: {
        kuib: {
          reasoningEffort: "none",
        },
      },
      prepareStep: async function (step) {
        const pending = params.takePending?.() ?? [];
        if (pending.length === 0) {
          return {};
        }
        const injected = [...step.messages];
        for (const text of pending) {
          await emitUserMessage(text);
          injected.push({ role: "user", content: text });
        }
        return { messages: injected };
      },
    });

    const errorPartID = newID(Protocol.ID.PartID);
    const consume = async function (): Promise<void> {
      for await (const part of result.fullStream) {
        switch (part.type) {
          case "text-delta": {
            await emit({
              type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
              messageID,
              partID: Protocol.ID.PartID.parse(part.id),
              delta: part.text,
            });
            break;
          }
          case "reasoning-delta": {
            await emit({
              type: Protocol.Event.EventTypeEnum.REASONING_DELTA,
              messageID,
              partID: Protocol.ID.PartID.parse(part.id),
              delta: part.text,
            });
            break;
          }
          case "tool-call": {
            await emit({
              type: Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED,
              callID: Protocol.ID.ToolCallID.parse(part.toolCallId),
            });
            break;
          }
          case "tool-result": {
            await emit({
              type: Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED,
              messageID,
              partID: newID(Protocol.ID.PartID),
              callID: Protocol.ID.ToolCallID.parse(part.toolCallId),
              output: JSON.stringify(part.output),
              completedAt: Date.now(),
              kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
            });
            break;
          }
          case "tool-error": {
            await emit({
              type: Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED,
              messageID,
              partID: newID(Protocol.ID.PartID),
              callID: Protocol.ID.ToolCallID.parse(part.toolCallId),
              reason: Protocol.ToolCall.ToolCallErrorReasonEnum.FAILED,
              error:
                part.error instanceof Error
                  ? part.error.message
                  : String(part.error),
              completedAt: Date.now(),
              kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
            });
            break;
          }
          case "error": {
            const cause = part.error;
            throw cause instanceof Error ? cause : new Error(String(cause));
          }
          default:
            break;
        }
      }
    };

    const [streamError] = await Std.withError(consume());
    if (streamError) {
      await emit({
        type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
        messageID,
        partID: errorPartID,
        delta: `⚠️ ${streamError.message}`,
      });
      await emit({
        type: Protocol.Event.EventTypeEnum.MESSAGE_FAILED,
        messageID,
        error: streamError.message,
        completedAt: Date.now(),
      });
      return;
    }
    await emit({
      type: Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED,
      messageID,
      completedAt: Date.now(),
    });
  });
};

export default runAgent;
export type { RunAgentParams };
