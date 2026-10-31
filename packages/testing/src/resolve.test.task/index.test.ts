import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import resolveTestTask from "./index.ts";

describe("resolveTestTask", function () {
  it("maps each kind to its Nx target", function () {
    expect(resolveTestTask(null)).toBe("test");
    expect(resolveTestTask(TestKindEnum.TEST)).toBe("test");
    expect(resolveTestTask(TestKindEnum.LIVE)).toBe("test:live");
    expect(resolveTestTask(TestKindEnum.BENCH)).toBe("bench");
  });
});
