// @context @journal/host-layer
import type { ModelMessage } from "ai";
import type { PartText } from "@kuib-ai/protocol/part/part.text";
import type { EventLogPort } from "../event.log/event.log.port";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";

const isTextPart = function (part: { type: string }): part is PartText {
  return part.type === "text";
};

const buildMessages = function (
  eventLog: EventLogPort,
  sessionID: SessionID,
): ModelMessage[] {
  const messages: ModelMessage[] = [];
  let assistant: { messageID: string; text: string } | null = null;

  const flushAssistant = function (): void {
    if (assistant !== null && assistant.text.length > 0) {
      messages.push({ role: "assistant", content: assistant.text });
    }
    assistant = null;
  };

  eventLog.replay(sessionID, -1, ({ event }) => {
    switch (event.type) {
      case "user-message-submitted": {
        flushAssistant();
        const text = event.parts
          .filter(isTextPart)
          .map((part) => part.text)
          .join("");
        messages.push({ role: "user", content: text });
        break;
      }
      case "text-delta": {
        if (assistant === null || assistant.messageID !== event.messageID) {
          flushAssistant();
          assistant = { messageID: event.messageID, text: "" };
        }
        assistant.text += event.delta;
        break;
      }
      case "message-completed":
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
