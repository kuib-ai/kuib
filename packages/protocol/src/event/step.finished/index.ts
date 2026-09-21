// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import { StepBoundaryStopReasonEnum } from "../../part/step.boundary.stop.reason.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

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
