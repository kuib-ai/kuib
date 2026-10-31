import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import createTempDir from "../packages/testing/src/create.temp.dir/index.ts";
import {
  changedSince,
  commandWithPrompt,
  deliver,
  handoffMessage,
  handoffOpening,
  itemReports,
  reportRef,
  testTitles,
} from "./orchestra.ts";

const SCRIPT = join(import.meta.dirname!, "orchestra.ts");

const call = async function (
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
) {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    env,
    stdout: "piped",
    stderr: "piped",
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
};

const git = async function (cwd: string, args: string[]) {
  const result = await call("git", args, cwd);
  expect(result.code).toBe(0);
  return result.stdout;
};

const repo = async function (path: string) {
  await git(path, ["init", "-q"]);
  mkdirSync(join(path, "journal", "features", "probe", "tasks"), {
    recursive: true,
  });
};

const task = function (path: string, id: string, grant: string[] = []) {
  const folder = join(path, "journal", "features", "probe", "tasks", id);
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    join(folder, "brief.md"),
    `---\nstatus: "draft"\nrole: "implementer"\ngate: "none"\nitems: []\ngrant: ${JSON.stringify(grant)}\nagent: ""\ncommand: ""\ncwd: ""\nsession: ""\nstarted: ""\nfinished: ""\nreported: ""\n---\n# ${id}\n\n## Objective\n\nTest the actual orchestra tool.\n`,
  );
  return folder;
};

const orchestra = async function (
  cwd: string,
  env: Record<string, string>,
  args: string[],
) {
  return call(
    Deno.execPath(),
    ["run", "--no-check", "--no-lock", "-A", SCRIPT, ...args],
    cwd,
    env,
  );
};

const fakeAgent = function (root: string) {
  const fake = join(root, "codex");
  writeFileSync(
    fake,
    `#!/bin/sh\nprintf '%s\\n' "$@" > "$ORCHESTRA_ROOT/argv.txt"\nsleep 30\n`,
  );
  chmodSync(fake, 0o755);
  return fake;
};

const runtimeFile = function (root: string, id: string): string {
  const brief = readFileSync(
    join(root, "journal", "features", "probe", "tasks", id, "brief.md"),
    "utf-8",
  );
  const session = brief.match(/^session: "([^"]+)"/m)?.[1] ?? "";
  return join(
    tmpdir(),
    `orchestra-${Deno.uid()}`,
    createHash("sha1").update(session).digest("hex").slice(0, 10),
    `${id}.json`,
  );
};

const withTmux = async function (
  path: string,
  work: (env: Record<string, string>, socket: string) => Promise<void>,
) {
  const socket = join(path, "tmux.sock");
  const session = basename(path).replaceAll(/[^a-zA-Z0-9]/g, "");
  const started = await call(
    "tmux",
    ["-S", socket, "new-session", "-d", "-s", session, "-x", "120", "-y", "40"],
    path,
  );
  expect(started.code).toBe(0);
  const shell = await call(
    "tmux",
    ["-S", socket, "set-option", "-g", "default-shell", "/bin/sh"],
    path,
  );
  expect(shell.code).toBe(0);
  const env = { TMUX: `${socket},1,0`, ORCHESTRA_ROOT: path, TMPDIR: tmpdir() };
  try {
    await work(env, socket);
  } finally {
    await call("tmux", ["-S", socket, "kill-server"], path);
  }
};

describe("orchestra", function () {
  it("keeps a test title when its file moves and finds literal Deno titles", async function () {
    using temporary = createTempDir("orchestra-titles-");
    await repo(temporary.path);
    writeFileSync(
      join(temporary.path, "first.test.ts"),
      `it("kept title", () => {}); it.skip("skipped title", () => {}); Deno.test({ name: "object title", fn() {} });`,
    );
    expect(testTitles(temporary.path)).toEqual([
      "kept title",
      "object title",
      "skipped title",
    ]);
    writeFileSync(join(temporary.path, "first.test.ts"), "");
    writeFileSync(
      join(temporary.path, "second.test.ts"),
      `it("kept title", () => {});`,
    );
    expect(testTitles(temporary.path)).toEqual(["kept title"]);
  });

  it("places the prompt before variadic options in a wrapped launch command", function () {
    const command = `choom -n 800 -- codex --mcp-config '{"servers":{}}'`;
    const result = commandWithPrompt(command, "codex", "", "/tmp/prompt.md");
    expect(result).toContain(`codex "$(cat '/tmp/prompt.md')" --mcp-config`);
    expect(() =>
      commandWithPrompt(
        "choom -- codex -- codex",
        "codex",
        "",
        "/tmp/prompt.md",
      ),
    ).toThrow();
  });

  it("keeps a baseline dirty path when it disappears from current dirt", function () {
    const baseline = {
      top: "",
      head: "",
      branch: "",
      dirty: { "before.ts": "abc" },
    };
    const current = { top: "", head: "", branch: "", dirty: {} };
    expect(changedSince(baseline, current)).toEqual(["before.ts"]);
  });

  it("uses one task report reference for every accepted item", function () {
    using temporary = createTempDir("orchestra-refs-");
    const folder = task(temporary.path, "work");
    const brief = join(folder, "brief.md");
    writeFileSync(
      brief,
      readFileSync(brief, "utf-8").replace(
        "items: []",
        'items: ["P04-I01", "P04-I02"]',
      ),
    );
    const record = { id: "work", feature: "probe", folder, brief };
    const report = reportRef(record);
    expect(itemReports(record)).toEqual([
      { item: "P04-I01", refs: [report] },
      { item: "P04-I02", refs: [report] },
    ]);
  });

  it("delivers a prompt before a trailing variadic flag and reports changes since spawn", async function () {
    using temporary = createTempDir("orchestra-spawn-");
    const root = temporary.path;
    await repo(root);
    writeFileSync(join(root, "modified.ts"), "before");
    writeFileSync(join(root, "removed.ts"), "before");
    await git(root, ["add", "modified.ts", "removed.ts"]);
    await git(root, [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-qm",
      "initial",
    ]);
    task(root, "work", ["modified.ts"]);
    const fake = fakeAgent(root);
    await withTmux(root, async function (env) {
      const spawned = await orchestra(root, env, [
        "spawn",
        "work",
        "codex",
        "--cmd",
        `${fake} --mcp-config config`,
        "--arg",
      ]);
      if (spawned.code !== 0) throw new Error(spawned.stderr || spawned.stdout);
      const argv = readFileSync(join(root, "argv.txt"), "utf-8").split("\n");
      expect(argv[0]).toContain("You are the orchestra worker for task 'work'");
      expect(argv[1]).toBe("--mcp-config");
      writeFileSync(join(root, "modified.ts"), "after");
      Deno.removeSync(join(root, "removed.ts"));
      writeFileSync(join(root, "added.ts"), "new");
      const diff = await orchestra(root, env, ["diff", "work"]);
      expect(diff.code).toBe(0);
      expect(diff.stdout).toContain("added   added.ts");
      expect(diff.stdout).toContain("changed modified.ts");
      expect(diff.stdout).toContain("removed removed.ts");
    });
  });

  it("fails spawn when the foreground agent has no prompt in its argv", async function () {
    using temporary = createTempDir("orchestra-swallow-");
    const root = temporary.path;
    await repo(root);
    task(root, "work");
    const fake = join(root, "codex");
    writeFileSync(fake, "#!/bin/sh\nexec sleep 30\n");
    chmodSync(fake, 0o755);
    await withTmux(root, async function (env) {
      const spawned = await orchestra(root, env, [
        "spawn",
        "work",
        "codex",
        "--cmd",
        `${fake} --mcp-config config`,
        "--arg",
      ]);
      expect(spawned.code).toBe(1);
      expect(spawned.stderr).toContain(
        "prompt did not reach the agent in w:work",
      );
      expect(spawned.stderr).toContain("work.prompt.md");
    });
  });

  it("refuses a missing test title, permits a moved title and records an intentional removal", async function () {
    using temporary = createTempDir("orchestra-accept-");
    const root = temporary.path;
    await repo(root);
    const folder = task(root, "work");
    writeFileSync(
      join(root, "original.test.ts"),
      `it("original proof", () => {});`,
    );
    const fake = fakeAgent(root);
    await withTmux(root, async function (env) {
      const spawned = await orchestra(root, env, [
        "spawn",
        "work",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (spawned.code !== 0) throw new Error(spawned.stderr);
      writeFileSync(join(folder, "report.md"), "# report\n");
      expect((await orchestra(root, env, ["done", "work"])).code).toBe(0);
      writeFileSync(join(root, "original.test.ts"), "");
      const refused = await orchestra(root, env, ["accept", "work"]);
      expect(refused.code).toBe(1);
      expect(refused.stderr).toContain("original proof");
      writeFileSync(
        join(root, "moved.test.ts"),
        `it("original proof", () => {});`,
      );
      expect(testTitles(root)).toContain("original proof");
      const moved = await orchestra(root, env, ["accept", "work"]);
      if (moved.code !== 0) throw new Error(moved.stderr);
      expect(readFileSync(join(folder, "brief.md"), "utf-8")).toContain(
        'status: "accepted"',
      );
      const removal = task(root, "removal");
      const spawnedAgain = await orchestra(root, env, [
        "spawn",
        "removal",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (spawnedAgain.code !== 0) throw new Error(spawnedAgain.stderr);
      writeFileSync(join(removal, "report.md"), "# report\n");
      expect((await orchestra(root, env, ["done", "removal"])).code).toBe(0);
      writeFileSync(join(root, "moved.test.ts"), "");
      const allowed = await orchestra(root, env, [
        "accept",
        "removal",
        "--removed-title",
        "original proof",
      ]);
      if (allowed.code !== 0) throw new Error(allowed.stderr);
      expect(readFileSync(join(removal, "brief.md"), "utf-8")).toContain(
        'status: "accepted"',
      );
    });
  });

  it("fails closed without a title snapshot and records an explicit legacy exception", async function () {
    using temporary = createTempDir("orchestra-legacy-");
    const root = temporary.path;
    await repo(root);
    const folder = task(root, "work");
    const fake = fakeAgent(root);
    await withTmux(root, async function (env) {
      const spawned = await orchestra(root, env, [
        "spawn",
        "work",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (spawned.code !== 0) throw new Error(spawned.stderr);
      const path = runtimeFile(root, "work");
      const runtime = JSON.parse(readFileSync(path, "utf-8"));
      delete runtime.test_titles;
      writeFileSync(path, JSON.stringify(runtime));
      writeFileSync(join(folder, "report.md"), "# report\n");
      expect((await orchestra(root, env, ["done", "work"])).code).toBe(0);
      const refused = await orchestra(root, env, ["accept", "work"]);
      expect(refused.code).toBe(1);
      expect(refused.stderr).toContain("--without-title-guard");
      const accepted = await orchestra(root, env, [
        "accept",
        "work",
        "--without-title-guard",
      ]);
      if (accepted.code !== 0) throw new Error(accepted.stderr);
      expect(readFileSync(join(folder, "brief.md"), "utf-8")).toContain(
        "Accepted with --without-title-guard",
      );
      const rebooted = task(root, "rebooted");
      const spawnedAfter = await orchestra(root, env, [
        "spawn",
        "rebooted",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (spawnedAfter.code !== 0) throw new Error(spawnedAfter.stderr);
      writeFileSync(join(rebooted, "report.md"), "# report\n");
      expect((await orchestra(root, env, ["done", "rebooted"])).code).toBe(0);
      unlinkSync(runtimeFile(root, "rebooted"));
      const lost = await orchestra(root, env, ["accept", "rebooted"]);
      expect(lost.code).toBe(1);
      expect(lost.stderr).toContain("--without-title-guard");
      const recovered = await orchestra(root, env, [
        "accept",
        "rebooted",
        "--without-title-guard",
      ]);
      if (recovered.code !== 0) throw new Error(recovered.stderr);
      expect(recovered.stdout).toContain(
        "files changed since spawn unknown (no baseline)",
      );
      expect(readFileSync(join(rebooted, "brief.md"), "utf-8")).toContain(
        "Accepted with --without-title-guard",
      );
    });
  });

  it("attributes scope to either running grant and stays quiet after restart", async function () {
    using temporary = createTempDir("orchestra-scope-");
    const root = temporary.path;
    await repo(root);
    task(root, "one", ["one.ts", "argv.txt"]);
    const other = task(root, "two", ["two.ts"]);
    const fake = fakeAgent(root);
    await withTmux(root, async function (env, socket) {
      const spawned = await orchestra(root, env, [
        "spawn",
        "one",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (spawned.code !== 0) throw new Error(spawned.stderr);
      const session = (
        await call(
          "tmux",
          ["-S", socket, "display-message", "-p", "#{session_name}"],
          root,
        )
      ).stdout.trim();
      const second = await call(
        "tmux",
        ["-S", socket, "new-window", "-d", "-n", "w:two", "sleep", "30"],
        root,
      );
      expect(second.code).toBe(0);
      const brief = readFileSync(join(other, "brief.md"), "utf-8")
        .replace('status: "draft"', 'status: "running"')
        .replace('session: ""', `session: "${session}"`)
        .replace('cwd: ""', `cwd: "${root}"`);
      writeFileSync(join(other, "brief.md"), brief);
      writeFileSync(join(root, "two.ts"), "other task");
      const cross = await orchestra(root, env, [
        "watch",
        "one",
        "--idle",
        "999",
        "--interval",
        "0.1",
        "--timeout",
        "1",
      ]);
      expect(cross.stdout).not.toContain("scope:");
      writeFileSync(join(root, "outside.ts"), "outside both grants");
      const outside = await orchestra(root, env, [
        "watch",
        "one",
        "--idle",
        "999",
        "--interval",
        "0.1",
        "--timeout",
        "1",
      ]);
      expect(outside.stdout).toContain(
        "scope: outside.ts changed outside the grant",
      );
      const restarted = await orchestra(root, env, ["restart", "one"]);
      if (restarted.code !== 0) throw new Error(restarted.stderr);
      const quiet = await orchestra(root, env, [
        "watch",
        "one",
        "--idle",
        "999",
        "--interval",
        "0.1",
        "--timeout",
        "1",
      ]);
      expect(quiet.stdout).not.toContain("scope:");
    });
  });

  it("keeps a stopped peer's grant for overlapping work but excludes an earlier task", async function () {
    using temporary = createTempDir("orchestra-stopped-scope-");
    const root = temporary.path;
    await repo(root);
    const first = task(root, "one", ["one.ts", "argv.txt"]);
    const second = task(root, "two", ["two.ts", "argv.txt"]);
    const earlier = task(root, "earlier", ["earlier.ts"]);
    const fake = fakeAgent(root);
    await withTmux(root, async function (env) {
      const one = await orchestra(root, env, [
        "spawn",
        "one",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (one.code !== 0) throw new Error(one.stderr);
      const two = await orchestra(root, env, [
        "spawn",
        "two",
        "codex",
        "--cmd",
        fake,
        "--arg",
      ]);
      if (two.code !== 0) throw new Error(two.stderr);
      writeFileSync(join(root, "two.ts"), "peer work");
      writeFileSync(join(second, "report.md"), "# report\n");
      expect((await orchestra(root, env, ["done", "two"])).code).toBe(0);
      const finished = readFileSync(join(second, "brief.md"), "utf-8");
      expect(finished).toContain('status: "done"');
      expect(finished).toMatch(/finished: "\d{4}-/);
      const overlap = await orchestra(root, env, [
        "watch",
        "one",
        "--idle",
        "999",
        "--interval",
        "0.1",
        "--timeout",
        "1",
      ]);
      expect(overlap.stdout).not.toContain("scope: two.ts");
      const oldBrief = readFileSync(join(earlier, "brief.md"), "utf-8")
        .replace('status: "draft"', 'status: "done"')
        .replace('cwd: ""', `cwd: "${root}"`)
        .replace('started: ""', 'started: "2020-01-01T00:00:00"')
        .replace('finished: ""', 'finished: "2020-01-01T00:00:01"');
      writeFileSync(join(earlier, "brief.md"), oldBrief);
      writeFileSync(join(root, "earlier.ts"), "unrelated old task");
      const outside = await orchestra(root, env, [
        "watch",
        "one",
        "--idle",
        "999",
        "--interval",
        "0.1",
        "--timeout",
        "1",
      ]);
      expect(outside.stdout).toContain(
        "scope: earlier.ts changed outside the grant",
      );
      expect(outside.stdout).not.toContain("scope: two.ts");
      const started = readFileSync(join(first, "brief.md"), "utf-8").match(
        /^started: "([^"]+)"/m,
      )?.[1];
      const restarted = await orchestra(root, env, ["restart", "one"]);
      if (restarted.code !== 0) throw new Error(restarted.stderr);
      expect(readFileSync(join(first, "brief.md"), "utf-8")).toContain(
        `started: "${started}"`,
      );
    });
  });

  it("puts the opening before a whole multiline handoff prompt and preserves its last newline", async function () {
    using temporary = createTempDir("orchestra-handoff-");
    const root = temporary.path;
    const supplied = "First line with 'quotes'\nSecond line\n";
    const opening = handoffOpening("probe");
    expect(opening).toContain("Read the briefs of active tasks");
    expect(opening).toContain("pnpm journal handoff probe");
    expect(opening).toContain("pnpm orchestra status");
    expect(opening).toContain("pnpm orchestra watch");
    expect(handoffMessage("probe", "")).toBe(opening);
    const message = handoffMessage("probe", supplied);
    expect(message).toBe(`${opening}\n\n${supplied}`);
    await withTmux(root, async function (_env, socket) {
      const captureFile = join(root, "pasted.txt");
      const reader = join(root, "reader.ts");
      writeFileSync(
        reader,
        `const path = Deno.args[0]; const needed = Number(Deno.args[1]); let seen = 0; for await (const bytes of Deno.stdin.readable) { await Deno.writeFile(path, bytes, { append: true, create: true }); seen += new TextDecoder().decode(bytes).split("\\n").length - 1; if (seen >= needed) { console.log("DONE"); await new Promise((resolve) => setTimeout(resolve, 5000)); break; } }`,
      );
      const needed = message.split("\n").length;
      const opened = await call(
        "tmux",
        [
          "-S",
          socket,
          "new-window",
          "-d",
          "-P",
          "-F",
          "#{pane_id}",
          "-n",
          "paste",
          "/bin/sh",
          "-c",
          `${Deno.execPath()} run --no-check --no-lock -A '${reader}' '${captureFile}' ${needed}`,
        ],
        root,
      );
      expect(opened.code).toBe(0);
      const pane = opened.stdout.trim();
      const previous = Deno.env.get("TMUX");
      Deno.env.set("TMUX", `${socket},1,0`);
      try {
        deliver(pane, message, "paste", true);
      } finally {
        if (previous === undefined) Deno.env.delete("TMUX");
        else Deno.env.set("TMUX", previous);
      }
      expect(readFileSync(captureFile, "utf-8")).toContain(message);
    });
  });

  it("refuses an empty handoff and leaves the pane unchanged when the saved prompt is missing", async function () {
    using temporary = createTempDir("orchestra-handoff-missing-");
    const root = temporary.path;
    await repo(root);
    const empty = join(root, "empty.md");
    writeFileSync(empty, "\n");
    await withTmux(root, async function (env, socket) {
      const pane = (
        await call(
          "tmux",
          ["-S", socket, "display-message", "-p", "#{pane_id}"],
          root,
        )
      ).stdout.trim();
      const initialized = await orchestra(root, { ...env, TMUX_PANE: pane }, [
        "init",
        "probe",
      ]);
      expect(initialized.code).toBe(0);
      const refused = await orchestra(root, { ...env, TMUX_PANE: pane }, [
        "handoff",
        "--file",
        empty,
      ]);
      expect(refused.code).toBe(1);
      expect(refused.stderr).toContain("nothing to hand off");
      const before = (
        await call(
          "tmux",
          ["-S", socket, "capture-pane", "-p", "-J", "-t", pane],
          root,
        )
      ).stdout;
      const missing = await orchestra(root, env, [
        "_guard",
        pane,
        "probe",
        "0",
        join(root, "missing-prompt.md"),
      ]);
      expect(missing.stderr).toContain("pane left unchanged");
      const after = (
        await call(
          "tmux",
          ["-S", socket, "capture-pane", "-p", "-J", "-t", pane],
          root,
        )
      ).stdout;
      expect(after).toBe(before);
    });
  });
});
