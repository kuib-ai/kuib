// @context @journal/domains/core#^C012
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import ErrorBase from "../error.base/index.ts";

const ErrorDaemonUnreachable = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.DAEMON_UNREACHABLE),
  endpoint: z.string().optional(),
});
type ErrorDaemonUnreachable = z.infer<typeof ErrorDaemonUnreachable>;

export default ErrorDaemonUnreachable;
export type { ErrorDaemonUnreachable };
