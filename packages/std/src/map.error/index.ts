// @context @journal/domains/infra#^C021
import Protocol from "@kuib-ai/protocol";
import type { AnyError } from "@kuib-ai/protocol/error/error.any";

const detailsFromCause = function (
  cause: unknown,
): Record<string, unknown> | undefined {
  if (cause === null || typeof cause !== "object") {
    return undefined;
  }
  const record = cause as Record<string, unknown>;
  const details: Record<string, unknown> = {};
  if ("stdout" in record) {
    details.stdout = record.stdout;
  }
  if ("stderr" in record) {
    details.stderr = record.stderr;
  }
  if ("code" in record) {
    details.code = record.code;
  }
  if ("statusCode" in record) {
    details.statusCode = record.statusCode;
  }
  if (Object.keys(details).length === 0) {
    return undefined;
  }
  return details;
};

const messageFromCause = function (cause: unknown): string {
  if (cause instanceof globalThis.Error) {
    return cause.message;
  }
  if (typeof cause === "string") {
    return cause;
  }
  return String(cause);
};

const mapError = function (cause: unknown): AnyError {
  const parsed = Protocol.Error.AnyError.safeParse(cause);
  if (parsed.success) {
    return parsed.data;
  }
  return Protocol.Error.ErrorUnknown.decode({
    code: Protocol.Error.ErrorCodeEnum.UNKNOWN,
    message: messageFromCause(cause),
    details: detailsFromCause(cause),
  });
};

export default mapError;
