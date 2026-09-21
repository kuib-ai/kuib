// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import { ToolCallErrorReasonEnum } from "../../tool.call/tool.call.error.reason.enum/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";
import ErrorBase from "../error.base/index.ts";

const ErrorToolFailed = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.TOOL_FAILED),
  reason: z.enum(ToolCallErrorReasonEnum),
  callID: ToolCallID.optional(),
});
type ErrorToolFailed = z.infer<typeof ErrorToolFailed>;

export default ErrorToolFailed;
export type { ErrorToolFailed };
