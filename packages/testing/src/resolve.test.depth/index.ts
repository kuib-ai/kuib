// @claim infra/test-bounds
const NESTED_DEPTH = 1;
const DEPTH = /^\d+$/;

type TestDepth = { depth: number; refusal: string | null };

// @claim infra/test-bounds
const resolveTestDepth = function (
  env: Record<string, string | undefined>,
): TestDepth {
  const raw = env["KUIB_TEST_DEPTH"];
  const depth = raw === undefined ? 0 : Number(raw);
  if (raw !== undefined && !DEPTH.test(raw)) {
    return {
      depth: Number.NaN,
      refusal: `KUIB_TEST_DEPTH is "${raw}", which is not a depth; the test runner does not start.`,
    };
  }
  if (depth === 0) {
    return { depth, refusal: null };
  }
  if (depth > NESTED_DEPTH) {
    return {
      depth,
      refusal: `the test runner was started inside a nested test run (depth ${depth}); nesting stops at one level.`,
    };
  }
  if (env["KUIB_TEST_NESTED"] !== "1") {
    return {
      depth,
      refusal:
        "the test runner was started inside a test. A test does not start the runner; the runner's own test opts in, for one level, with KUIB_TEST_NESTED=1.",
    };
  }
  return { depth, refusal: null };
};

export default resolveTestDepth;
export type { TestDepth };
