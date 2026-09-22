// @claim core/tool-call-states
import { z } from "zod";
import { ToolCallStatusEnum } from "../tool.call.status.enum/index.ts";
import { ToolCallKindEnum } from "../tool.call.kind.enum/index.ts";
import { ToolCallErrorReasonEnum } from "../tool.call.error.reason.enum/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

const ToolCallErrorBase = z.object({
  status: z.literal(ToolCallStatusEnum.ERROR),
  reason: z.enum(ToolCallErrorReasonEnum),
  kind: z.enum(ToolCallKindEnum),
  error: z.string(),
  completedAt: z.number(),
});

const ToolCallErrorNormal = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
type ToolCallErrorNormal = z.infer<typeof ToolCallErrorNormal>;

const ToolCallErrorSubagent = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
type ToolCallErrorSubagent = z.infer<typeof ToolCallErrorSubagent>;

// @claim core/tool-call-states
const ToolCallError = z.discriminatedUnion("kind", [
  ToolCallErrorNormal,
  ToolCallErrorSubagent,
]);
type ToolCallError = z.infer<typeof ToolCallError>;

export default ToolCallError;
export type { ToolCallError, ToolCallErrorNormal, ToolCallErrorSubagent };
