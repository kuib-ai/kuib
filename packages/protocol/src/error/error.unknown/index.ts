// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum";
import ErrorBase from "../error.base";

const ErrorUnknown = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.UNKNOWN),
});
type ErrorUnknown = z.infer<typeof ErrorUnknown>;

export default ErrorUnknown;
export type { ErrorUnknown };
