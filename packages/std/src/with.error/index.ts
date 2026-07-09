// @context @journal/house-style-linting
type Result<T> = [Error, null] | [null, T];

interface IWithError {
  <T>(promise: Promise<T>): Promise<Result<T>>;
  <T>(fn: () => Promise<T>): Promise<Result<T>>;
  <T>(fn: () => T): Result<T>;
}

const isPromise = function (input: unknown): input is Promise<unknown> {
  return (
    input !== null &&
    typeof input === "object" &&
    "then" in input &&
    typeof (input as { then: unknown }).then === "function"
  );
};

const withError: IWithError = function (input: unknown) {
  if (isPromise(input)) {
    return input.then(
      (value) => [null, value],
      (error) => [
        error instanceof Error ? error : new Error(String(error)),
        null,
      ],
    );
  }

  if (typeof input === "function") {
    // eslint-disable-next-line no-restricted-syntax
    try {
      const result = input();

      if (isPromise(result)) {
        return result.then(
          (value) => [null, value],
          (error) => [
            error instanceof Error ? error : new Error(String(error)),
            null,
          ],
        );
      }

      return [null, result] as const;
    } catch (error: unknown) {
      return [
        error instanceof Error ? error : new Error(String(error)),
        null,
      ] as const;
    }
  }

  const error = new Error(`Invalid input received for withError`);
  return [error, null] as const;
} as IWithError;

export default withError;
export type { Result };
