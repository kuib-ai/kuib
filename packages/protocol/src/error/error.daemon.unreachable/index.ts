// @context @journal/protocol-design
import { z } from "zod";
import { ErrorCodeEnum } from "../error.code.enum";
import ErrorBase from "../error.base";

const ErrorDaemonUnreachable = ErrorBase.extend({
  code: z.literal(ErrorCodeEnum.DAEMON_UNREACHABLE),
  endpoint: z.string().optional(),
});
type ErrorDaemonUnreachable = z.infer<typeof ErrorDaemonUnreachable>;

export default ErrorDaemonUnreachable;
export type { ErrorDaemonUnreachable };
