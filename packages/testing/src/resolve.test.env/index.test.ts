import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { delimiter } from "node:path";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import resolveTestEnv from "./index.ts";

const sandbox = {
  home: "/sandbox/home",
  temp: "/sandbox/tmp",
  slots: "/sandbox/slots",
  sockets: ["/sandbox/s/0", "/sandbox/s/1"],
};

const caller = {
  PATH: "/usr/bin",
  HOME: "/home/someone",
  TMPDIR: "/somewhere",
  NO_COLOR: "1",
  OPENAI_API_KEY: "secret",
  KUIB_TEST_DEPTH: "0",
  KUIB_TEST_NESTED: "1",
  KUIB_TEST_SLOTS: "/elsewhere",
  UNDEFINED: undefined,
};

describe("resolveTestEnv", function () {
  it("gives a unit test only the path, the sandbox, the deno cache, its depth and the colour switches", function () {
    const env = resolveTestEnv({
      kind: TestKindEnum.TEST,
      sandbox,
      env: caller,
      denoDir: "/cache/deno",
      depth: 1,
    });

    expect(env).toEqual({
      PATH: "/usr/bin",
      NO_COLOR: "1",
      HOME: "/sandbox/home",
      TMPDIR: "/sandbox/tmp",
      DENO_DIR: "/cache/deno",
      KUIB_TEST_SOCKETS: ["/sandbox/s/0", "/sandbox/s/1"].join(delimiter),
      KUIB_TEST_SLOTS: "/sandbox/slots",
      KUIB_TEST_DEPTH: "1",
    });
  });

  it("gives a benchmark the same environment as a unit test", function () {
    const input = { sandbox, env: caller, denoDir: "/cache/deno", depth: 1 };

    expect(resolveTestEnv({ ...input, kind: TestKindEnum.BENCH })).toEqual(
      resolveTestEnv({ ...input, kind: TestKindEnum.TEST }),
    );
  });

  it("keeps the caller's environment under a live test, with the sandbox on top", function () {
    const env = resolveTestEnv({
      kind: TestKindEnum.LIVE,
      sandbox,
      env: caller,
      denoDir: "/cache/deno",
      depth: 1,
    });

    expect(env["OPENAI_API_KEY"]).toBe("secret");
    expect(env["HOME"]).toBe("/sandbox/home");
    expect(env["TMPDIR"]).toBe("/sandbox/tmp");
    expect("UNDEFINED" in env).toBe(false);
  });

  it("never hands the opt-in for a nested run to a test, and sets the depth and the slots itself", function () {
    for (const kind of Object.values(TestKindEnum)) {
      const env = resolveTestEnv({
        kind,
        sandbox,
        env: caller,
        denoDir: "/cache/deno",
        depth: 2,
      });

      expect("KUIB_TEST_NESTED" in env).toBe(false);
      expect(env["KUIB_TEST_DEPTH"]).toBe("2");
      expect(env["KUIB_TEST_SLOTS"]).toBe("/sandbox/slots");
    }
  });
});
