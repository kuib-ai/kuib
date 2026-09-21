// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import ErrorBase from "../error.base/index.ts";

const ErrorConfigInvalid = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.CONFIG_INVALID),
  key: z.string().optional(),
});
type ErrorConfigInvalid = z.infer<typeof ErrorConfigInvalid>;

export default ErrorConfigInvalid;
export type { ErrorConfigInvalid };
