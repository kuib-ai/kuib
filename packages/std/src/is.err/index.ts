// @context @journal/house-style-linting
import type { AnyError } from "@kuib-ai/protocol/error/error.any";

type Result<T, E = AnyError> = [E, null] | [null, T];

const isErr = function <T, E>(result: Result<T, E>): result is [E, null] {
  return result[0] !== null;
};

export default isErr;
export type { Result };
