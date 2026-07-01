// @context @journal/architecture-overview
import { streamText, stepCountIs, type LanguageModel } from "ai";
import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";
import Tools from "@kuib-ai/tools";
import newID from "../new.id";
import buildMessages from "../build.messages";
import Provider from "../provider";
import createDaemonFileSystem from "../daemon.file.system";
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

  const fileSystem = createDaemonFileSystem(daemonClient);
  const tools = Provider.buildTools(Tools.registry, { fs: fileSystem });

  const messages = buildMessages(eventLog, sessionID);

  const result = streamText({
    model,
    messages,
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
      } else if (part.type === "tool-call") {
        await emit({
          type: Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED,
          callID: Protocol.ID.ToolCallID.parse(part.toolCallId),
        });
      } else if (part.type === "tool-result") {
        await emit({
          type: Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED,
          messageID,
          partID: newID(Protocol.ID.PartID),
          callID: Protocol.ID.ToolCallID.parse(part.toolCallId),
          output: JSON.stringify(part.output),
          completedAt: Date.now(),
          kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
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
