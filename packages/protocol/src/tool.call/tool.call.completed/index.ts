// @claim core/tool-call-states
import { z } from "zod";
import { ToolCallStatusEnum } from "../tool.call.status.enum/index.ts";
import { ToolCallKindEnum } from "../tool.call.kind.enum/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

const ToolCallCompletedBase = z.object({
  status: z.literal(ToolCallStatusEnum.COMPLETED),
  kind: z.enum(ToolCallKindEnum),
  output: z.string(),
  completedAt: z.number(),
});

const ToolCallCompletedNormal = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
type ToolCallCompletedNormal = z.infer<typeof ToolCallCompletedNormal>;

const ToolCallCompletedSubagent = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
type ToolCallCompletedSubagent = z.infer<typeof ToolCallCompletedSubagent>;

// @claim core/tool-call-states
const ToolCallCompleted = z.discriminatedUnion("kind", [
  ToolCallCompletedNormal,
  ToolCallCompletedSubagent,
]);
type ToolCallCompleted = z.infer<typeof ToolCallCompleted>;

export default ToolCallCompleted;
export type {
  ToolCallCompleted,
  ToolCallCompletedNormal,
  ToolCallCompletedSubagent,
};
