// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import { ToolCallKindEnum } from "../../tool.call/tool.call.kind.enum";
import { ToolCallErrorReasonEnum } from "../../tool.call/tool.call.error.reason.enum";
import MessageID from "../../id/message.id";
import PartID from "../../id/part.id";
import ToolCallID from "../../id/tool.call.id";
import ModelRef from "../../model.ref";
import TokenUsage from "../../token.usage";

const ToolCallFailed = z.object({
  type: z.literal(EventTypeEnum.TOOL_CALL_FAILED),
  messageID: MessageID,
  partID: PartID,
  callID: ToolCallID,
  reason: z.enum(ToolCallErrorReasonEnum),
  error: z.string(),
  completedAt: z.number(),
  kind: z.enum(ToolCallKindEnum),
  model: ModelRef.optional(),
  tokens: TokenUsage.optional(),
});
type ToolCallFailed = z.infer<typeof ToolCallFailed>;

export default ToolCallFailed;
export type { ToolCallFailed };
