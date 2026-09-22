// @claim infra/with-error
import type { AnyError } from "@kuib-ai/protocol/error/error.any";
import mapError from "../map.error/index.ts";

type ErrorLogFields = {
  err: AnyError;
};

// @claim infra/with-error
const errorFields = function (cause: unknown): ErrorLogFields {
  return { err: mapError(cause) };
};

export default errorFields;
export type { ErrorLogFields };
