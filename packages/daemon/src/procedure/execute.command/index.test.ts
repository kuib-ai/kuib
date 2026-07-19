import { describe, it, expect } from "bun:test";
import Trpc from "../../trpc";
import executeCommand from "./index";

const router = Trpc.router({ executeCommand });
const createCaller = Trpc.createCallerFactory(router);
const caller = createCaller({});

describe("executeCommand procedure", function () {
  it("returns stdout, empty stderr and exitCode 0 for a successful command", async function () {
    const result = await caller.executeCommand({
      command: "printf 'hello'",
    });
    expect(result.stdout).toBe("hello");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
  });

  it("maps a failing command to its exit code with captured stdout/stderr", async function () {
    const result = await caller.executeCommand({
      command: "printf 'out'; printf 'err' 1>&2; exit 3",
    });
    expect(result.stdout).toBe("out");
    expect(result.stderr).toBe("err");
    expect(result.exitCode).toBe(3);
  });

  it("falls back to exitCode 1 and error.message for a non-existent command", async function () {
    const result = await caller.executeCommand({
      command: "this_command_definitely_does_not_exist_kuib",
    });
    expect(result.exitCode).toBe(127);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it("honours cwd and merges provided env over process defaults", async function () {
    const result = await caller.executeCommand({
      command: "pwd; printf '%s' \"$KUIB_TEST_VAR\"",
      cwd: "/",
      env: { KUIB_TEST_VAR: "merged" },
    });
    expect(result.stdout).toBe("/\nmerged");
    expect(result.exitCode).toBe(0);
  });
});
