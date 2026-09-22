// @claim core/protocol-parts
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import { StepBoundaryKindEnum } from "../step.boundary.kind.enum/index.ts";
import { StepBoundaryStopReasonEnum } from "../step.boundary.stop.reason.enum/index.ts";
import PartBase from "../part.base/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

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

// @claim core/protocol-parts
const PartStepBoundary = z.discriminatedUnion("kind", [
  PartStepBoundaryStart,
  PartStepBoundaryStop,
]);
type PartStepBoundary = z.infer<typeof PartStepBoundary>;

export default PartStepBoundary;
export type { PartStepBoundary, PartStepBoundaryStart, PartStepBoundaryStop };
