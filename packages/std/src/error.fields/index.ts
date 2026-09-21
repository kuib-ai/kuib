// @context @journal/observability
import type { AnyError } from "@kuib-ai/protocol/error/error.any";
import mapError from "../map.error/index.ts";

type ErrorLogFields = {
  err: AnyError;
};

const errorFields = function (cause: unknown): ErrorLogFields {
  return { err: mapError(cause) };
};

export default errorFields;
export type { ErrorLogFields };
