// @context @journal/protocol-design
import { ErrorCodeEnum } from "./error.code.enum";
import ErrorBase from "./error.base";
import ErrorUnknown from "./error.unknown";
import ErrorConfigInvalid from "./error.config.invalid";
import ErrorDaemonUnreachable from "./error.daemon.unreachable";
import ErrorToolFailed from "./error.tool.failed";
import ErrorLlmFailed from "./error.llm.failed";
import AnyError from "./error.any";

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
