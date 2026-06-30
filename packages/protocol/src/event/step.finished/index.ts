// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import { StepBoundaryStopReasonEnum } from "../../part/step.boundary.stop.reason.enum";
import MessageID from "../../id/message.id";
import PartID from "../../id/part.id";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

const StepFinished = z.object({
  type: z.literal(EventTypeEnum.STEP_FINISHED),
  messageID: MessageID,
  partID: PartID,
  reason: z.enum(StepBoundaryStopReasonEnum),
  model: ModelRef,
  tokens: TokenUsage,
});
type StepFinished = z.infer<typeof StepFinished>;

export default StepFinished;
export type { StepFinished };
