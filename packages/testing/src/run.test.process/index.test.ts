import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "../create.temp.dir/index.ts";
import runTestProcess from "./index.ts";

describe("runTestProcess", function () {
  it("returns the real child exit code", async function () {
    using cwd = createTempDir();
    const code = await runTestProcess(
      Deno.execPath(),
      ["eval", "--no-check", "Deno.exit(7)"],
      { cwd: cwd.path },
    );
    expect(code).toBe(7);
  });
});
