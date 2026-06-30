// @context @journal/protocol-design
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum";
import { StepBoundaryKindEnum } from "../step.boundary.kind.enum";
import { StepBoundaryStopReasonEnum } from "../step.boundary.stop.reason.enum";
import PartBase from "../part.base";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

const StepBoundaryPartBase = PartBase.extend({
  type: z.literal(PartTypeEnum.STEP_BOUNDARY),
});

const PartStepBoundaryStart = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_START),
});
type PartStepBoundaryStart = z.infer<typeof PartStepBoundaryStart>;

const PartStepBoundaryStop = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_STOP),
  reason: z.enum(StepBoundaryStopReasonEnum),
  model: ModelRef,
  tokens: TokenUsage,
});
type PartStepBoundaryStop = z.infer<typeof PartStepBoundaryStop>;

const PartStepBoundary = z.discriminatedUnion("kind", [
  PartStepBoundaryStart,
  PartStepBoundaryStop,
]);
type PartStepBoundary = z.infer<typeof PartStepBoundary>;

export default PartStepBoundary;
export type { PartStepBoundary, PartStepBoundaryStart, PartStepBoundaryStop };
