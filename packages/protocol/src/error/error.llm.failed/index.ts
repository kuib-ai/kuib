// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum";
import { MessageAssistantErrorKindEnum } from "../../message/message.assistant.error.kind.enum";
import ErrorBase from "../error.base";

const ErrorLlmFailed = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.LLM_FAILED),
  kind: z.enum(MessageAssistantErrorKindEnum).optional(),
  statusCode: z.number().optional(),
});
type ErrorLlmFailed = z.infer<typeof ErrorLlmFailed>;

export default ErrorLlmFailed;
export type { ErrorLlmFailed };
