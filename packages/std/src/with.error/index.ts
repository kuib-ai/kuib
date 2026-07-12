// @context @journal/house-style-linting
import type { AnyError } from "@kuib-ai/protocol/error/error.any";
import mapError from "../map.error";
import type { Result } from "../is.err";

interface IWithError {
  <T, E = AnyError>(
    promise: Promise<T>,
    map?: (cause: unknown) => E,
  ): Promise<Result<T, E>>;
  <T, E = AnyError>(
    fn: () => Promise<T>,
    map?: (cause: unknown) => E,
  ): Promise<Result<T, E>>;
  <T, E = AnyError>(fn: () => T, map?: (cause: unknown) => E): Result<T, E>;
}

const isPromise = function (input: unknown): input is Promise<unknown> {
  return (
    input !== null &&
    typeof input === "object" &&
    "then" in input &&
    typeof (input as { then: unknown }).then === "function"
  );
};

const toMapped = function <E>(
  cause: unknown,
  map: ((cause: unknown) => E) | undefined,
): E {
  if (map !== undefined) {
    return map(cause);
  }
  return mapError(cause) as E;
};

const withError: IWithError = function (
  input: unknown,
  map?: (cause: unknown) => unknown,
) {
  if (isPromise(input)) {
    return input.then(
      (value) => [null, value],
      (error) => [toMapped(error, map), null],
    );
  }

  if (typeof input === "function") {
    // eslint-disable-next-line no-restricted-syntax
    try {
      const result = input();

      if (isPromise(result)) {
        return result.then(
          (value) => [null, value],
          (error) => [toMapped(error, map), null],
        );
      }

      return [null, result] as const;
    } catch (error: unknown) {
      return [toMapped(error, map), null] as const;
    }
  }

  return [
    toMapped(new globalThis.Error(`Invalid input received for withError`), map),
    null,
  ] as const;
} as IWithError;

export default withError;
export type { Result };
