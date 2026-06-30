// @context @journal/protocol-design
import { z } from "zod";
import { ToolCallStatusEnum } from "../tool.call.status.enum";
import { ToolCallKindEnum } from "../tool.call.kind.enum";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

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
