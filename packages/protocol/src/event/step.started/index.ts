// @context @journal/domains/core#^C006
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";

const StepStarted = z.object({
  type: z.literal(EventTypeEnum.STEP_STARTED),
  messageID: MessageID,
  partID: PartID,
});
type StepStarted = z.infer<typeof StepStarted>;

export default StepStarted;
export type { StepStarted };
