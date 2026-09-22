// @claim core/protocol-errors
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum/index.ts";
import ErrorBase from "../error.base/index.ts";

// @claim core/protocol-errors
const ErrorDaemonUnreachable = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.DAEMON_UNREACHABLE),
  endpoint: z.string().optional(),
});
type ErrorDaemonUnreachable = z.infer<typeof ErrorDaemonUnreachable>;

export default ErrorDaemonUnreachable;
export type { ErrorDaemonUnreachable };
