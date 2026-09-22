// @claim core/protocol-events
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";

// @claim core/protocol-events
const ReasoningDelta = z.object({
  type: z.literal(EventTypeEnum.REASONING_DELTA),
  messageID: MessageID,
  partID: PartID,
  delta: z.string(),
});
type ReasoningDelta = z.infer<typeof ReasoningDelta>;

export default ReasoningDelta;
export type { ReasoningDelta };
