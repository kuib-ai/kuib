// @context @journal/domains/core#^C012
import { ErrorCodeEnum } from "./error.code.enum/index.ts";
import ErrorBase from "./error.base/index.ts";
import ErrorUnknown from "./error.unknown/index.ts";
import ErrorConfigInvalid from "./error.config.invalid/index.ts";
import ErrorDaemonUnreachable from "./error.daemon.unreachable/index.ts";
import ErrorToolFailed from "./error.tool.failed/index.ts";
import ErrorLlmFailed from "./error.llm.failed/index.ts";
import AnyError from "./error.any/index.ts";

const Error = {
  ErrorCodeEnum,
  ErrorBase,
  ErrorUnknown,
  ErrorConfigInvalid,
  ErrorDaemonUnreachable,
  ErrorToolFailed,
  ErrorLlmFailed,
  AnyError,
};

export default Error;
