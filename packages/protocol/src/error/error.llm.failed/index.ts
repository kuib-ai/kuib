// @context @journal/domains/core#^C012
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import { MessageAssistantErrorKindEnum } from "../../message/message.assistant.error.kind.enum/index.ts";
import ErrorBase from "../error.base/index.ts";

const ErrorLlmFailed = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.LLM_FAILED),
  kind: z.enum(MessageAssistantErrorKindEnum).optional(),
  statusCode: z.number().optional(),
});
type ErrorLlmFailed = z.infer<typeof ErrorLlmFailed>;

export default ErrorLlmFailed;
export type { ErrorLlmFailed };
