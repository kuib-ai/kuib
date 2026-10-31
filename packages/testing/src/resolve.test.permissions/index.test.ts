import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import resolveTestPermissions from "./index.ts";

const sandbox = { root: "/sandbox", sockets: ["/sandbox/s/0", "/sandbox/s/1"] };
const workspaceRoot = join(import.meta.dirname!, "..", "..", "..", "..");

const state = function (descriptor: Deno.PermissionDescriptor): string {
  return Deno.permissions.querySync(descriptor).state;
};

describe("resolveTestPermissions", function () {
  it("grants a unit test reading, the environment, the sandbox and loopback, and no more", function () {
    using workspace = createTempDir("workspace-");

    expect(
      resolveTestPermissions({
        kind: TestKindEnum.TEST,
        project: "@kuib-ai/anything",
        sandbox,
        workspaceRoot: workspace.path,
      }),
    ).toEqual([
      "--no-prompt",
      "--allow-read",
      `--deny-read=${join(workspace.path, ".env")}`,
      "--allow-env",
      "--allow-sys",
      "--allow-write=/sandbox",
      "--allow-net=127.0.0.1,localhost,[::1],unix:/sandbox/s/0,unix:/sandbox/s/1",
    ]);
  });

  it("denies every .env file of the workspace except the example", function () {
    const flags = resolveTestPermissions({
      kind: TestKindEnum.TEST,
      project: "@kuib-ai/anything",
      sandbox,
      workspaceRoot,
    });
    const denied = flags.find(function (flag) {
      return flag.startsWith("--deny-read=");
    });

    expect(denied).toContain(join(workspaceRoot, ".env"));
    expect(denied).not.toContain(".env.example");
  });

  it("grants spawning for daemon, testing and named tooling subprocesses", function () {
    using workspace = createTempDir("workspace-");
    const input = {
      kind: TestKindEnum.TEST,
      sandbox,
      workspaceRoot: workspace.path,
    };
    const daemon = resolveTestPermissions({
      ...input,
      project: "@kuib-ai/daemon",
    });
    const tooling = resolveTestPermissions({
      ...input,
      project: "@kuib-ai/tooling",
    });
    const testing = resolveTestPermissions({
      ...input,
      project: "@kuib-ai/testing",
    });

    expect(daemon).toContain("--allow-run");
    expect(daemon).toContain(
      "--allow-net=127.0.0.1,localhost,[::1],[::],0.0.0.0,unix:/sandbox/s/0,unix:/sandbox/s/1",
    );
    expect(tooling).toContain(`--allow-run=${Deno.execPath()},git,tmux`);
    expect(tooling).not.toContain("--allow-run");
    expect(testing).toContain("--allow-run");
    expect(tooling).toContain(
      "--allow-net=127.0.0.1,localhost,[::1],unix:/sandbox/s/0,unix:/sandbox/s/1",
    );
  });

  it("lets inference start workspace Deno and refuses another program", async function () {
    using temporary = createTempDir("inference-run-");
    const flags = resolveTestPermissions({
      kind: TestKindEnum.TEST,
      project: "@kuib-ai/inference",
      sandbox: { root: temporary.path, sockets: [] },
      workspaceRoot,
    });
    expect(flags).toContain(`--allow-run=${Deno.execPath()}`);
    expect(flags).not.toContain("--allow-run");
    const probe = join(temporary.path, "probe.ts");
    writeFileSync(
      probe,
      `
      const allowed = await new Deno.Command(Deno.execPath(), { args: ["--version"], stdout: "null", stderr: "null" }).output();
      let refused = false;
      try { await new Deno.Command("/usr/bin/env", { stdout: "null", stderr: "null" }).output(); }
      catch { refused = true; }
      console.log(JSON.stringify({ allowed: allowed.code, refused }));
    `,
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: ["run", "--no-check", "--no-lock", ...flags, probe],
      cwd: workspaceRoot,
      stdout: "piped",
      stderr: "piped",
    }).output();
    expect(output.code).toBe(0);
    expect(JSON.parse(new TextDecoder().decode(output.stdout))).toEqual({
      allowed: 0,
      refused: true,
    });
  });

  it("leaves the engine packages unrestricted apart from the .env files", function () {
    using workspace = createTempDir("workspace-");

    for (const project of ["@kuib-ai/engine", "@kuib-ai/engine-service"]) {
      expect(
        resolveTestPermissions({
          kind: TestKindEnum.TEST,
          project,
          sandbox,
          workspaceRoot: workspace.path,
        }),
      ).toEqual([
        "--no-prompt",
        "--allow-all",
        `--deny-read=${join(workspace.path, ".env")}`,
      ]);
    }
  });

  it("lets a live test reach any host and read the .env files", function () {
    using workspace = createTempDir("workspace-");
    const flags = resolveTestPermissions({
      kind: TestKindEnum.LIVE,
      project: "@kuib-ai/anything",
      sandbox,
      workspaceRoot: workspace.path,
    });

    expect(flags).toContain("--allow-net");
    expect(
      flags.some(function (flag) {
        return flag.startsWith("--deny-read");
      }),
    ).toBe(false);
  });

  it("gives a benchmark the permissions of a unit test", function () {
    using workspace = createTempDir("workspace-");
    const input = {
      project: "@kuib-ai/anything",
      sandbox,
      workspaceRoot: workspace.path,
    };

    expect(
      resolveTestPermissions({ ...input, kind: TestKindEnum.BENCH }),
    ).toEqual(resolveTestPermissions({ ...input, kind: TestKindEnum.TEST }));
  });

  it("refuses a remote host, a write outside the sandbox, a spawn and the workspace .env", async function () {
    using temporary = createTempDir("permissions-");
    const descriptors: Deno.PermissionDescriptor[] = [
      { name: "net", host: "example.com" },
      { name: "net", host: "api.openai.com:443" },
      { name: "write", path: workspaceRoot },
      { name: "write", path: join(workspaceRoot, "x") },
      { name: "run" },
      { name: "read", path: join(workspaceRoot, ".env") },
    ];
    const source = `
      const states = ${JSON.stringify(descriptors)}.map((descriptor) => Deno.permissions.querySync(descriptor).state);
      let spawn = "allowed";
      try {
        new Deno.Command(Deno.execPath(), { args: ["--version"], stdout: "null", stderr: "null" }).outputSync();
      } catch (error) {
        spawn = String(error);
      }
      console.log(JSON.stringify({ states, spawn }));
    `;
    const probe = join(temporary.path, "probe.ts");
    writeFileSync(probe, source);
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--no-check",
        "--no-lock",
        ...resolveTestPermissions({
          kind: TestKindEnum.TEST,
          project: "@kuib-ai/anything",
          sandbox: { root: temporary.path, sockets: [] },
          workspaceRoot,
        }),
        probe,
      ],
      cwd: workspaceRoot,
      stdout: "piped",
      stderr: "piped",
    }).output();
    const decoder = new TextDecoder();

    expect(decoder.decode(output.stderr)).toBe("");
    expect(output.code).toBe(0);
    const result = JSON.parse(decoder.decode(output.stdout)) as {
      states: string[];
      spawn: string;
    };
    const { states } = result;
    for (const state of states.slice(0, 5)) {
      expect(state).not.toBe("granted");
    }
    expect(result.spawn).toContain("Requires run access");
    expect(states[5]).toBe("denied");
  });

  it("allows loopback, reading the workspace and writing the temp folder", function () {
    expect(state({ name: "net", host: "127.0.0.1" })).toBe("granted");
    expect(state({ name: "net", host: "localhost:8080" })).toBe("granted");
    expect(state({ name: "read", path: workspaceRoot })).toBe("granted");
    expect(state({ name: "write", path: tmpdir() })).toBe("granted");
    expect(state({ name: "env" })).toBe("granted");
  });
});
