// @context @journal/domains/core#^C012
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import ErrorBase from "../error.base/index.ts";

const ErrorUnknown = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.UNKNOWN),
});
type ErrorUnknown = z.infer<typeof ErrorUnknown>;

export default ErrorUnknown;
export type { ErrorUnknown };
