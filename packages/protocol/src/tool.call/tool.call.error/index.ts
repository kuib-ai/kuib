// @context @journal/protocol-design
import { z } from "zod";
import { ToolCallStatusEnum } from "../tool.call.status.enum";
import { ToolCallKindEnum } from "../tool.call.kind.enum";
import { ToolCallErrorReasonEnum } from "../tool.call.error.reason.enum";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

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

const ToolCallError = z.discriminatedUnion("kind", [
  ToolCallErrorNormal,
  ToolCallErrorSubagent,
]);
type ToolCallError = z.infer<typeof ToolCallError>;

export default ToolCallError;
export type { ToolCallError, ToolCallErrorNormal, ToolCallErrorSubagent };
