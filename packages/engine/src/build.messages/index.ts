// @context @journal/host-layer
import type { ModelMessage } from "ai";
import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";
import type { PartText } from "@kuib-ai/protocol/part/part.text";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";

const isTextPart = function (part: { type: string }): part is PartText {
  return part.type === Protocol.Part.PartTypeEnum.TEXT;
};

const parseInput = function (raw: string): Record<string, unknown> {
  const [error, value] = Std.withError(function () {
    return JSON.parse(raw) as Record<string, unknown>;
  });
  if (error) {
    return {};
  }
  return value;
};

const buildMessages = function (
  eventLog: EventLogPort,
  sessionID: SessionID,
): ModelMessage[] {
  const resolved = new Set<string>();
  eventLog.replay(sessionID, -1, function ({ event }) {
    if (
      event.type === Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED ||
      event.type === Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED
    ) {
      resolved.add(event.callID);
    }
  });

  const messages: ModelMessage[] = [];
  let assistantText = "";
  let assistantMessageID: string | null = null;
  const toolNames = new Map<string, string>();

  const flushAssistant = function (): void {
    if (assistantText.length > 0) {
      messages.push({ role: "assistant", content: assistantText });
    }
    assistantText = "";
    assistantMessageID = null;
  };

  eventLog.replay(sessionID, -1, function ({ event }) {
    switch (event.type) {
      case Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED: {
        flushAssistant();
        const text = event.parts
          .filter(isTextPart)
          .map(function (part) {
            return part.text;
          })
          .join("");
        messages.push({ role: "user", content: text });
        break;
      }
      case Protocol.Event.EventTypeEnum.TEXT_DELTA: {
        if (
          assistantMessageID !== null &&
          assistantMessageID !== event.messageID
        ) {
          flushAssistant();
        }
        assistantMessageID = event.messageID;
        assistantText += event.delta;
        break;
      }
      case Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED: {
        if (event.name === undefined || !resolved.has(event.callID)) {
          break;
        }
        flushAssistant();
        toolNames.set(event.callID, event.name);
        messages.push({
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: event.callID,
              toolName: event.name,
              input: parseInput(event.input ?? "{}"),
            },
          ],
        });
        break;
      }
      case Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED: {
        if (!toolNames.has(event.callID)) {
          break;
        }
        messages.push({
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: event.callID,
              toolName: toolNames.get(event.callID)!,
              output: { type: "text", value: event.output },
            },
          ],
        });
        break;
      }
      case Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED: {
        if (!toolNames.has(event.callID)) {
          break;
        }
        messages.push({
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: event.callID,
              toolName: toolNames.get(event.callID)!,
              output: { type: "error-text", value: event.error },
            },
          ],
        });
        break;
      }
      case Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED:
        flushAssistant();
        break;
      default:
        break;
    }
  });
  flushAssistant();

  return messages;
};

export default buildMessages;
