// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import { ToolCallKindEnum } from "../../tool.call/tool.call.kind.enum";
import MessageID from "../../id/message.id";
import PartID from "../../id/part.id";
import ToolCallID from "../../id/tool.call.id";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

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
