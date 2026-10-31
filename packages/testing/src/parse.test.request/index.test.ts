import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import parseTestRequest from "./index.ts";
import { TestKindEnum } from "../test.kind.enum/index.ts";

describe("parseTestRequest", function () {
  it("keeps paths before flags and forwards Deno flags", function () {
    expect(
      parseTestRequest(
        [
          "--",
          "packages/env/src",
          "--affected",
          "--kind=live",
          "--filter",
          "walks up",
        ],
        1,
      ),
    ).toEqual({
      paths: ["packages/env/src"],
      flags: ["--filter", "walks up"],
      kind: TestKindEnum.LIVE,
      affected: true,
      coverage: false,
      depth: 1,
    });
  });

  it("rejects an unknown kind", function () {
    expect(function () {
      parseTestRequest(["--kind=slow"], 0);
    }).toThrow("unknown --kind=slow");
  });
});
