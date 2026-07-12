// @context @journal/protocol-design
import { z } from "zod";
import ErrorUnknown from "../error.unknown";
import ErrorConfigInvalid from "../error.config.invalid";
import ErrorDaemonUnreachable from "../error.daemon.unreachable";
import ErrorToolFailed from "../error.tool.failed";
import ErrorLlmFailed from "../error.llm.failed";

const AnyError = z.discriminatedUnion("code", [
  ErrorUnknown,
  ErrorConfigInvalid,
  ErrorDaemonUnreachable,
  ErrorToolFailed,
  ErrorLlmFailed,
]);
type AnyError = z.infer<typeof AnyError>;

export default AnyError;
export type { AnyError };
