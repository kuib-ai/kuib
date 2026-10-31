import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import acquireTestSlot from "../acquire.test.slot/index.ts";
import createTempDir from "../create.temp.dir/index.ts";
import overrideEnv from "../override.env/index.ts";
import runTestCommand from "./index.ts";
import type { TempDir } from "../create.temp.dir/index.ts";
import type { TestSlot } from "../acquire.test.slot/index.ts";

const RUNNER = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../bin/testing",
);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const HELD_SLOTS = 8;

const UNIT_TEST = `Deno.test("unit", function () {
  if (Deno.env.get("KUIB_TEST_DEPTH") !== "2") {
    throw new Error("depth is " + Deno.env.get("KUIB_TEST_DEPTH"));
  }
  if (Deno.env.get("KUIB_TEST_NESTED") !== undefined) {
    throw new Error("the opt-in reached a test");
  }
  const temp = Deno.env.get("TMPDIR");
  Deno.writeTextFileSync(temp + "/left-behind.txt", "by a test");
  console.log("SANDBOX_TEMP=" + temp);
});
`;

const LIVE_TEST = `Deno.test("live", function () {
  const net = Deno.permissions.querySync({ name: "net", host: "example.com" });
  if (net.state !== "granted") {
    throw new Error("a live test may reach any host");
  }
  console.log("LIVE_RAN");
});
`;

const BENCH = `Deno.bench("noop", function () {});
`;

const REMOTE_TEST = `Deno.test("remote", async function () {
  await fetch("https://example.com/");
});
`;

const BARE = `console.log("BARE_LOADED");
`;

type Outcome = { code: number; stdout: string; stderr: string };

const write = function (path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const createProject = function (files: Record<string, string>): TempDir {
  const project = createTempDir("project-");
  write(join(project.path, "package.json"), `{ "name": "tiny" }\n`);
  for (const [path, content] of Object.entries(files)) {
    write(join(project.path, path), content);
  }
  return project;
};

const nestedEnv = function (
  changes: Record<string, string | undefined> = {},
): Record<string, string> {
  const env: Record<string, string> = { KUIB_TEST_NESTED: "1", NO_COLOR: "1" };
  for (const key of [
    "PATH",
    "HOME",
    "TMPDIR",
    "DENO_DIR",
    "KUIB_TEST_DEPTH",
    "KUIB_TEST_SLOTS",
  ]) {
    const value = process.env[key];
    if (value !== undefined) {
      env[key] = value;
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      delete env[key];
      continue;
    }
    env[key] = value;
  }
  return env;
};

const command = function (
  cwd: string,
  args: string[],
  env: Record<string, string>,
): Deno.Command {
  return new Deno.Command(RUNNER, {
    args,
    cwd,
    env,
    clearEnv: true,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  });
};

const runRunner = async function (
  cwd: string,
  args: string[] = [],
  env: Record<string, string> = nestedEnv(),
): Promise<Outcome> {
  const output = await command(cwd, args, env).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
};

const pause = function (ms: number): Promise<string> {
  return new Promise<string>(function (resolve) {
    setTimeout(function () {
      resolve("running");
    }, ms);
  });
};

describe("runTestCommand", function () {
  it("returns code 2 for a request error", async function () {
    using _env = overrideEnv({ KUIB_TEST_NESTED: "1" });

    expect(await runTestCommand(["--kind=unknown"])).toBe(2);
  });

  it("forwards a Deno filter to the selected project", async function () {
    using project = createProject({
      "src/unit/index.test.ts":
        'Deno.test("chosen", function () {}); Deno.test("other", function () {});\n',
    });

    const outcome = await runRunner(project.path, ["--filter", "chosen"]);

    expect(outcome.code).toBe(0);
    expect(outcome.stdout).toContain("chosen ... ok");
    expect(outcome.stdout).not.toContain("other ... ok");
  });

  it("runs the owning project when started in a nested folder without paths", async function () {
    using project = createProject({
      "src/unit/index.test.ts": UNIT_TEST,
      "src/other/index.test.ts": 'Deno.test("sibling", function () {});\n',
    });

    const outcome = await runRunner(join(project.path, "src", "unit"));

    expect(outcome.code).toBe(0);
    expect(outcome.stdout).toContain("src/other/index.test.ts");
  });

  it("runs a project's tests one level down, in a sandbox that is gone afterwards", async function () {
    using project = createProject({
      "test.ts": BARE,
      "src/unit/index.test.ts": UNIT_TEST,
      "src/unit/index.live.test.ts": LIVE_TEST,
    });

    const outcome = await runRunner(project.path);

    expect(outcome.stderr).toBe("");
    expect(outcome.code).toBe(0);
    expect(outcome.stdout).toContain("src/unit/index.test.ts");
    const temp = /SANDBOX_TEMP=(.+)/.exec(outcome.stdout)?.[1] ?? "";
    expect(temp.length).toBeGreaterThan(0);
    expect(temp).not.toBe(process.env["TMPDIR"]);
    expect(existsSync(dirname(temp))).toBe(false);
  });

  it("does not run a file merely named test.ts, nor a live test, under the kind test", async function () {
    using project = createProject({
      "test.ts": BARE,
      "src/test.ts": BARE,
      "src/unit/index.test.ts": UNIT_TEST,
      "src/unit/index.live.test.ts": LIVE_TEST,
    });

    const whole = await runRunner(project.path);
    const folder = await runRunner(project.path, ["src"]);

    for (const outcome of [whole, folder]) {
      expect(outcome.code).toBe(0);
      expect(outcome.stdout).toContain("running 1 test from");
      expect(outcome.stdout).not.toContain("BARE_LOADED");
      expect(outcome.stdout).not.toContain("LIVE_RAN");
      expect(outcome.stdout).not.toContain("index.live.test.ts");
    }
  });

  it("runs only the live tests, with any host granted, under the kind live", async function () {
    using project = createProject({
      "src/unit/index.test.ts": UNIT_TEST,
      "src/unit/index.live.test.ts": LIVE_TEST,
    });

    const outcome = await runRunner(project.path, ["--kind=live"]);

    expect(outcome.code).toBe(0);
    expect(outcome.stdout).toContain("LIVE_RAN");
    expect(outcome.stdout).not.toContain("SANDBOX_TEMP");
  });

  it("runs the benchmarks under the kind bench", async function () {
    using project = createProject({
      "bench.ts": BARE,
      "src/unit/index.test.ts": UNIT_TEST,
      "src/unit/index.bench.ts": BENCH,
    });

    const outcome = await runRunner(project.path, ["--kind=bench"]);

    expect(outcome.code).toBe(0);
    expect(outcome.stdout).toContain("noop");
    expect(outcome.stdout).not.toContain("BARE_LOADED");
    expect(outcome.stdout).not.toContain("SANDBOX_TEMP");
  });

  it("fails a unit test that reaches a remote host, before anything is sent", async function () {
    using project = createProject({ "src/remote/index.test.ts": REMOTE_TEST });

    const outcome = await runRunner(project.path);

    expect(outcome.code).toBe(1);
    expect(outcome.stdout + outcome.stderr).toContain("Requires net access");
  });

  it("passes a project that has no test", async function () {
    using project = createProject({ "src/unit/index.ts": "export {};\n" });

    for (const kind of ["test", "live", "bench"]) {
      const outcome = await runRunner(project.path, [`--kind=${kind}`]);

      expect(outcome.code).toBe(0);
    }
  });

  it("refuses to start inside a test that did not opt in, and starts nothing", async function () {
    using project = createProject({ "src/unit/index.test.ts": UNIT_TEST });

    const outcome = await runRunner(
      project.path,
      [],
      nestedEnv({ KUIB_TEST_NESTED: undefined }),
    );

    expect(outcome.code).toBe(2);
    expect(outcome.stderr).toContain("started inside a test");
    expect(outcome.stdout).toBe("");
  });

  it("refuses a second level even with the opt-in", async function () {
    using project = createProject({ "src/unit/index.test.ts": UNIT_TEST });

    const outcome = await runRunner(
      project.path,
      [],
      nestedEnv({ KUIB_TEST_DEPTH: "2" }),
    );

    expect(outcome.code).toBe(2);
    expect(outcome.stderr).toContain("nesting stops at one level");
    expect(outcome.stdout).toBe("");
  });

  it("refuses to fan out through Nx from inside an Nx task", async function () {
    const outcome = await runRunner(
      ROOT,
      [],
      nestedEnv({ NX_TASK_TARGET_PROJECT: "@kuib-ai/tooling" }),
    );

    expect(outcome.code).toBe(2);
    expect(outcome.stderr).toContain("fan out through Nx");
    expect(outcome.stdout).toBe("");
  });

  it("waits while every slot is held and runs once one is freed", async function () {
    using project = createProject({ "src/unit/index.test.ts": UNIT_TEST });
    const slots = process.env["KUIB_TEST_SLOTS"] ?? "";
    const held: TestSlot[] = [];
    for (let index = 0; index < HELD_SLOTS; index += 1) {
      held.push(
        await acquireTestSlot({ dir: slots, limit: HELD_SLOTS, intervalMs: 5 }),
      );
    }
    const child = command(project.path, [], nestedEnv()).spawn();
    const stdout = new Response(child.stdout).text();
    const reader = child.stderr.getReader();
    const decoder = new TextDecoder();
    let stderr = "";

    while (!stderr.includes("waiting for a test slot")) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      stderr += decoder.decode(chunk.value, { stream: true });
    }
    const state = await Promise.race([
      child.status.then(function () {
        return "exited";
      }),
      pause(500),
    ]);

    expect(stderr).toContain("waiting for a test slot");
    expect(state).toBe("running");

    for (const slot of held) {
      slot[Symbol.dispose]();
    }
    const status = await child.status;
    await reader.cancel();

    expect(status.code).toBe(0);
    expect(await stdout).toContain("running 1 test from");
  });
});
