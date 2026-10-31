import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import resolveTestDepth from "./index.ts";

describe("resolveTestDepth", function () {
  it("starts at depth 0 when no runner is above", function () {
    expect(resolveTestDepth({})).toEqual({ depth: 0, refusal: null });
    expect(resolveTestDepth({ KUIB_TEST_DEPTH: "0" })).toEqual({
      depth: 0,
      refusal: null,
    });
  });

  it("refuses inside a test", function () {
    const resolved = resolveTestDepth({ KUIB_TEST_DEPTH: "1" });

    expect(resolved.depth).toBe(1);
    expect(resolved.refusal).toContain("started inside a test");
  });

  it("allows one level when the test opts in", function () {
    expect(
      resolveTestDepth({ KUIB_TEST_DEPTH: "1", KUIB_TEST_NESTED: "1" }),
    ).toEqual({ depth: 1, refusal: null });
  });

  it("refuses a second level even when the test opts in", function () {
    const resolved = resolveTestDepth({
      KUIB_TEST_DEPTH: "2",
      KUIB_TEST_NESTED: "1",
    });

    expect(resolved.depth).toBe(2);
    expect(resolved.refusal).toContain("nesting stops at one level");
  });

  it("refuses a depth it cannot read", function () {
    for (const raw of ["", "deep", "-1", "1.5"]) {
      const resolved = resolveTestDepth({
        KUIB_TEST_DEPTH: raw,
        KUIB_TEST_NESTED: "1",
      });

      expect(resolved.refusal).toContain("is not a depth");
    }
  });

  it("is at depth 1 inside this test, set by the runner, with no opt-in", function () {
    expect(process.env["KUIB_TEST_DEPTH"]).toBe("1");
    expect(process.env["KUIB_TEST_NESTED"]).toBeUndefined();
    expect(resolveTestDepth(process.env).refusal).not.toBeNull();
  });
});
