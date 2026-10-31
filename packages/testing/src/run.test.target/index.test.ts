import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import runTestTarget from "./index.ts";

describe("runTestTarget", function () {
  it("runs one project inside the test sandbox", async function () {
    using project = createTempDir();
    mkdirSync(join(project.path, "src"));
    writeFileSync(join(project.path, "package.json"), '{"name":"sample"}');
    writeFileSync(
      join(project.path, "src", "unit.test.ts"),
      'Deno.test("sandbox", () => { if (Deno.env.get("HOME") === undefined || Deno.env.get("TMPDIR") === undefined) throw new Error("missing sandbox"); });',
    );
    const code = await runTestTarget(
      { project: project.path, name: "sample", files: [] },
      {
        paths: [],
        flags: [],
        kind: null,
        affected: false,
        coverage: false,
        depth: 1,
      },
      project.path,
    );
    expect(code).toBe(0);
  });
});
