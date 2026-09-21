// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import { ToolCallKindEnum } from "../../tool.call/tool.call.kind.enum/index.ts";
import { ToolCallErrorReasonEnum } from "../../tool.call/tool.call.error.reason.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartID from "../../id/part.id/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";
import ModelRef from "../../model.ref/index.ts";
import TokenUsage from "../../token.usage/index.ts";

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
