// @context @journal/host-layer
import Protocol from "@kuib-ai/protocol";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { PartText } from "@kuib-ai/protocol/part/part.text";
import { TranscriptRoleEnum } from "../transcript.role.enum";
import type { TranscriptEntry } from "../transcript.entry";

const isTextPart = function (part: { type: string }): part is PartText {
  return part.type === Protocol.Part.PartTypeEnum.TEXT;
};

const foldTranscript = function (
  envelopes: readonly EventEnvelope[],
): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const assistantByMessage = new Map<string, TranscriptEntry>();
  const reasoningByMessage = new Map<string, TranscriptEntry>();

  for (const envelope of envelopes) {
    const event = envelope.event;
    switch (event.type) {
      case Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED: {
        const text = event.parts
          .filter(isTextPart)
          .map((part) => part.text)
          .join("");
        entries.push({
          id: event.messageID,
          role: TranscriptRoleEnum.USER,
          text,
        });
        break;
      }
      case Protocol.Event.EventTypeEnum.REASONING_DELTA: {
        let entry = reasoningByMessage.get(event.messageID);
        if (entry === undefined) {
          entry = {
            id: `${event.messageID}:reasoning`,
            role: TranscriptRoleEnum.REASONING,
            text: "",
          };
          reasoningByMessage.set(event.messageID, entry);
          entries.push(entry);
        }
        entry.text += event.delta;
        break;
      }
      case Protocol.Event.EventTypeEnum.TEXT_DELTA: {
        let entry = assistantByMessage.get(event.messageID);
        if (entry === undefined) {
          entry = {
            id: event.messageID,
            role: TranscriptRoleEnum.ASSISTANT,
            text: "",
          };
          assistantByMessage.set(event.messageID, entry);
          entries.push(entry);
        }
        entry.text += event.delta;
        break;
      }
      case Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED: {
        entries.push({
          id: event.callID,
          role: TranscriptRoleEnum.TOOL,
          text: `✓ ${event.output}`,
        });
        break;
      }
      case Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED: {
        entries.push({
          id: event.callID,
          role: TranscriptRoleEnum.TOOL,
          text: `✗ ${event.error}`,
        });
        break;
      }
      default:
        break;
    }
  }

  return entries;
};

export default foldTranscript;
