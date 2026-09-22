// @context @journal/domains/core#^C006
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import { ToolCallKindEnum } from "../../tool.call/tool.call.kind.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

const ToolCallCompleted = z.object({
  type: z.literal(EventTypeEnum.TOOL_CALL_COMPLETED),
  messageID: MessageID,
  partID: PartID,
  callID: ToolCallID,
  output: z.string(),
  completedAt: z.number(),
  kind: z.enum(ToolCallKindEnum),
  model: ModelRef.optional(),
  tokens: TokenUsage.optional(),
});
type ToolCallCompleted = z.infer<typeof ToolCallCompleted>;

export default ToolCallCompleted;
export type { ToolCallCompleted };
