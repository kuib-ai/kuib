// @context @journal/house-style-linting
type Result<T> = [Error, null] | [null, T];

const asyncWithError = function <T>(promise: Promise<T>): Promise<Result<T>> {
  return promise.then(
    (value): Result<T> => [null, value],
    (error): Result<T> => [
      error instanceof Error ? error : new Error(String(error)),
      null,
    ],
  );
};

export default asyncWithError;
export type { Result };
