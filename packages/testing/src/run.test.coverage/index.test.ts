import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import runTestCoverage from "./index.ts";

describe("runTestCoverage", function () {
  it("writes an empty total when the workspace has no test targets", async function () {
    using root = createTempDir();
    const project = join(root.path, "packages", "one");
    mkdirSync(project, { recursive: true });
    writeFileSync(join(project, "package.json"), '{"name":"one"}');
    const code = await runTestCoverage(
      {
        paths: [],
        flags: [],
        kind: null,
        affected: false,
        coverage: true,
        depth: 0,
      },
      root.path,
    );
    expect(code).toBe(0);
    expect(existsSync(join(root.path, "dist", "coverage", "total.lcov"))).toBe(
      true,
    );
  });

  it("collects production coverage from a selected test file", async function () {
    using root = createTempDir();
    const project = join(root.path, "packages", "one");
    mkdirSync(join(project, "src"), { recursive: true });
    writeFileSync(join(project, "package.json"), '{"name":"@probe/one"}');
    writeFileSync(join(project, "src", "unit.ts"), "export const value = 1;\n");
    writeFileSync(
      join(project, "src", "unit.test.ts"),
      'import { value } from "./unit.ts"; Deno.test("value", () => { if (value !== 1) throw new Error("wrong"); });\n',
    );
    const code = await runTestCoverage(
      {
        paths: ["packages/one/src/unit.test.ts"],
        flags: [],
        kind: null,
        affected: false,
        coverage: true,
        depth: 1,
      },
      root.path,
    );
    expect(code).toBe(0);
    expect(
      readFileSync(join(root.path, "dist", "coverage", "one.lcov"), "utf8"),
    ).toContain("unit.ts");
  });
});
