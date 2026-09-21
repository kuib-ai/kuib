// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";

const TextDelta = z.object({
  type: z.literal(EventTypeEnum.TEXT_DELTA),
  messageID: MessageID,
  partID: PartID,
  delta: z.string(),
});
type TextDelta = z.infer<typeof TextDelta>;

export default TextDelta;
export type { TextDelta };
