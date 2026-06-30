// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";
import PartID from "../../id/part.id";

const StepStarted = z.object({
  type: z.literal(EventTypeEnum.STEP_STARTED),
  messageID: MessageID,
  partID: PartID,
});
type StepStarted = z.infer<typeof StepStarted>;

export default StepStarted;
export type { StepStarted };
