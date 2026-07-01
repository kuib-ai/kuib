// @context @journal/host-layer
import type { ModelMessage } from "ai";
import Protocol from "@kuib-ai/protocol";
import type { PartText } from "@kuib-ai/protocol/part/part.text";
import type { EventLogPort } from "../event.log/event.log.port";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";

const isTextPart = function (part: { type: string }): part is PartText {
  return part.type === Protocol.Part.PartTypeEnum.TEXT;
};

type AssistantAccumulator = {
  messageID: string;
  text: string;
};

const buildMessages = function (
  eventLog: EventLogPort,
  sessionID: SessionID,
): ModelMessage[] {
  const messages: ModelMessage[] = [];
  let assistant: AssistantAccumulator | null = null;

  const flushAssistant = function (): void {
    if (assistant !== null && assistant.text.length > 0) {
      messages.push({ role: "assistant", content: assistant.text });
    }
    assistant = null;
  };

  eventLog.replay(sessionID, -1, ({ event }) => {
    switch (event.type) {
      case Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED: {
        flushAssistant();
        const text = event.parts
          .filter(isTextPart)
          .map((part) => part.text)
          .join("");
        messages.push({ role: "user", content: text });
        break;
      }
      case Protocol.Event.EventTypeEnum.TEXT_DELTA: {
        if (assistant === null || assistant.messageID !== event.messageID) {
          flushAssistant();
          assistant = { messageID: event.messageID, text: "" };
        }
        assistant.text += event.delta;
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
