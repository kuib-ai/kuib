// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";
import PartID from "../../id/part.id";

const TextDelta = z.object({
  type: z.literal(EventTypeEnum.TEXT_DELTA),
  messageID: MessageID,
  partID: PartID,
  delta: z.string(),
});
type TextDelta = z.infer<typeof TextDelta>;

export default TextDelta;
export type { TextDelta };
