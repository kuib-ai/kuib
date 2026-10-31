import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "../override.env/index.ts";
import runTestProjects from "./index.ts";

describe("runTestProjects", function () {
  it("refuses Nx fan-out from inside an Nx task", async function () {
    using _env = overrideEnv({ NX_TASK_TARGET_PROJECT: "@kuib-ai/testing" });
    await expect(
      runTestProjects({
        workspaceRoot: "/unused",
        request: {
          paths: [],
          flags: [],
          kind: null,
          affected: false,
          coverage: false,
          depth: 1,
        },
      }),
    ).rejects.toThrow("fan out through Nx");
  });
});
