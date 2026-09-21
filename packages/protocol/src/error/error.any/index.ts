// @context @journal/protocol-design
import { z } from "zod";
import ErrorUnknown from "../error.unknown/index.ts";
import ErrorConfigInvalid from "../error.config.invalid/index.ts";
import ErrorDaemonUnreachable from "../error.daemon.unreachable/index.ts";
import ErrorToolFailed from "../error.tool.failed/index.ts";
import ErrorLlmFailed from "../error.llm.failed/index.ts";

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
