// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum";
import { ToolCallErrorReasonEnum } from "../../tool.call/tool.call.error.reason.enum";
import ToolCallID from "../../id/tool.call.id";
import ErrorBase from "../error.base";

const ErrorToolFailed = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.TOOL_FAILED),
  reason: z.enum(ToolCallErrorReasonEnum),
  callID: ToolCallID.optional(),
});
type ErrorToolFailed = z.infer<typeof ErrorToolFailed>;

export default ErrorToolFailed;
export type { ErrorToolFailed };
