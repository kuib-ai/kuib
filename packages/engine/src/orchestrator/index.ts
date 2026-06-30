// @context @journal/architecture-overview
import { streamText, stepCountIs, tool, type LanguageModel } from "ai";
import { z } from "zod";
import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";
import newID from "../new.id";
import type { DaemonClient } from "../daemon.client/transport.factory";
import type { EventLogPort } from "../event.log/event.log.port";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";

type RunAgentParams = {
  prompt: string;
  sessionID: SessionID;
  deviceID: DeviceID;
  model: LanguageModel;
  daemonClient: DaemonClient;
  eventLog: EventLogPort;
};

const runAgent = async function (params: RunAgentParams): Promise<void> {
  const { prompt, sessionID, deviceID, model, daemonClient, eventLog } = params;
  const messageID = newID(Protocol.ID.MessageID);

  const emit = function (event: AnyEvent) {
    return eventLog.append(sessionID, deviceID, event);
  };

  await emit({
    type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
    messageID: newID(Protocol.ID.MessageID),
    parts: [
      {
        type: Protocol.Part.PartTypeEnum.TEXT,
        partID: newID(Protocol.ID.PartID),
        excluded: false,
        text: prompt,
      },
    ],
  });

  await emit({
    type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
    messageID,
  });

  const tools = {
    executeCommand: tool({
      description: "Execute a bash shell command on the target daemon machine.",
      inputSchema: z.object({
        command: z.string().min(1),
        cwd: z.string().optional(),
      }),
      execute: async ({ command, cwd }) => {
        const callID = newID(Protocol.ID.ToolCallID);
        await emit({
          type: Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED,
          callID,
        });
        const [error, result] = await Std.asyncWithError(
          daemonClient.executeCommand.mutate({ command, cwd: cwd ?? "." }),
        );
        const partID = newID(Protocol.ID.PartID);
        if (error) {
          await emit({
            type: Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED,
            messageID,
            partID,
            callID,
            reason: Protocol.ToolCall.ToolCallErrorReasonEnum.FAILED,
            error: error.message,
            completedAt: Date.now(),
            kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
          });
          return { error: error.message };
        }
        await emit({
          type: Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED,
          messageID,
          partID,
          callID,
          output: JSON.stringify(result),
          completedAt: Date.now(),
          kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
        });
        return result;
      },
    }),
    readFile: tool({
      description: "Read a file from the target daemon machine.",
      inputSchema: z.object({ path: z.string().min(1) }),
      execute: async ({ path }) => {
        const [error, result] = await Std.asyncWithError(
          daemonClient.readFile.query({ path }),
        );
        if (error) {
          return { error: error.message };
        }
        return result;
      },
    }),
    writeFile: tool({
      description: "Write a file on the target daemon machine.",
      inputSchema: z.object({
        path: z.string().min(1),
        content: z.string(),
      }),
      execute: async ({ path, content }) => {
        const [error, result] = await Std.asyncWithError(
          daemonClient.writeFile.mutate({ path, content }),
        );
        if (error) {
          return { error: error.message };
        }
        return result;
      },
    }),
  };

  const result = streamText({
    model,
    prompt,
    tools,
    stopWhen: stepCountIs(5),
  });

  const errorPartID = newID(Protocol.ID.PartID);
  const consume = async function (): Promise<void> {
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        await emit({
          type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
          messageID,
          partID: Protocol.ID.PartID.parse(part.id),
          delta: part.text,
        });
      } else if (part.type === "reasoning-delta") {
        await emit({
          type: Protocol.Event.EventTypeEnum.REASONING_DELTA,
          messageID,
          partID: Protocol.ID.PartID.parse(part.id),
          delta: part.text,
        });
      }
    }
  };

  const [streamError] = await Std.asyncWithError(consume());
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
};

export default runAgent;
export type { RunAgentParams };
