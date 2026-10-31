import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import resolveTestKind from "./index.ts";

describe("resolveTestKind", function () {
  it("infers live and bench from selected files", function () {
    expect(resolveTestKind(null, ["a.live.test.ts", "b.live.test.tsx"])).toBe(
      TestKindEnum.LIVE,
    );
    expect(resolveTestKind(null, ["a.bench.ts"])).toBe(TestKindEnum.BENCH);
    expect(resolveTestKind(null, ["a.test.ts", "b.live.test.ts"])).toBe(
      TestKindEnum.TEST,
    );
  });

  it("uses an explicit kind for a folder", function () {
    expect(resolveTestKind(TestKindEnum.BENCH, ["src"])).toBe(
      TestKindEnum.BENCH,
    );
  });
});
