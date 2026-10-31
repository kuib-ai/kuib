#!/usr/bin/env -S deno run -A
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "@std/yaml";
import ts from "typescript";
import Cli from "@kuib-ai/cli";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const SCRIPT = fileURLToPath(import.meta.url);
const PLAN_ITEM_HEADING = /^### (P\d{2}-I\d{2}) — /gm;
const FRONTMATTER = /^---\n([\s\S]*?)\n---(?:\n|$)/;
const FIELD_ORDER = [
  "status",
  "role",
  "gate",
  "items",
  "grant",
  "agent",
  "command",
  "cwd",
  "session",
  "started",
  "finished",
  "reported",
];
const LIST_FIELDS = ["items", "grant"];
const ROLES = ["implementer", "reviewer", "probe"];
const GATES = ["none", "plan"];
const STOP_STATUSES = ["plan-ready", "done", "blocked", "failed", "restart"];
const EVENT_STATUSES = [...STOP_STATUSES, "lost"];
const CLOSABLE_STATUSES = ["running", "restart", "plan-ready", "lost"];
const WORKER_FILE_FOR_STATUS: Record<string, string> = {
  done: "report.md",
  blocked: "report.md",
  failed: "report.md",
  "plan-ready": "plan.md",
  restart: "log.md",
};
const BUSY = /esc (?:to )?interrupt|ctrl\+c to (?:interrupt|stop)/i;
const PASTED_PLACEHOLDER = /\[Pasted[^\]\n]*\]?/;
const DIALOG =
  /do you trust|i trust this folder|press enter to continue|\(y\/n\)|\[y\/n\]/i;
const DIALOG_TAIL_LINES = 15;
const CONTEXT_USED_OF = /ctx (\d{1,3})% of/g;
const CONTEXT_PERCENT = /(\d{1,3})% (?:context|ctx)( left)?/g;
const CONTEXT_NAMED_FIRST = /[Cc]ontext (\d{1,3})% (used|left)/g;
const CONTEXT_TOKENS_PERCENT = /\d+(?:\.\d+)?[KkMm] \((\d{1,3})%\)/g;
const CONTEXT_LEFT_UNTIL_COMPACT =
  /Context left until auto-compact: (\d{1,3})%/g;
const BUSY_TAIL_LINES = 15;
const SCREEN_HISTORY_LINES = 60;
const VISIBLE_PREFIX_CHARS = 40;
const CONTEXT_DROP_MEANING_CLEARED = 10;
const READY_TIMEOUT_SECONDS = 90;
const PASTE_VISIBLE_TIMEOUT_SECONDS = 5;
const SUBMIT_ATTEMPTS = 3;
const MATCHED_LINES_KEPT = 200;
const MATCH_DETAIL_CHARS = 160;
const SUBMIT_WAIT_SECONDS = 2;
const LAUNCH_TIMEOUT_SECONDS = 20;
const HANDOFF_SETTLE_TIMEOUT_SECONDS = 600;
const JOURNAL_FILES_THE_ORCHESTRATOR_WRITES = [
  "journal/domains/*/current.md",
  "journal/features/*/plan.md",
  "journal/features/*/tasks/**",
  "journal/_index.md",
  "journal/roadmap/ROADMAP.md",
];
const WORKER_PROTOCOL = ".agents/skills/orchestrate/WORKER.md";
interface Agent {
  executable: string;
  command: string;
  promptFlag: string;
}
const OPENCODE_MODEL = "xiaomi-token-plan-sgp/mimo-v2.6-pro";
const AGENTS: Record<string, Agent> = {
  claude: {
    executable: "claude",
    command: "claude --dangerously-skip-permissions",
    promptFlag: "",
  },
  "kiro-claude": {
    executable: "kiro-claude",
    command: "kiro-claude --dangerously-skip-permissions",
    promptFlag: "",
  },
  "mimo-claude": {
    executable: "mimo-claude",
    command: "mimo-claude --dangerously-skip-permissions",
    promptFlag: "",
  },
  cursor: {
    executable: "cursor-agent",
    command: "cursor-agent",
    promptFlag: "",
  },
  "cursor-agent": {
    executable: "cursor-agent",
    command: "cursor-agent",
    promptFlag: "",
  },
  agy: {
    executable: "agy",
    command: "agy",
    promptFlag: "--prompt-interactive",
  },
  antigravity: {
    executable: "agy",
    command: "agy",
    promptFlag: "--prompt-interactive",
  },
  gemini: {
    executable: "gemini",
    command: "gemini",
    promptFlag: "--prompt-interactive",
  },
  codex: { executable: "codex", command: "codex", promptFlag: "" },
  opencode: {
    executable: "opencode",
    command: `env OPENCODE_CONFIG_CONTENT='${JSON.stringify({ model: OPENCODE_MODEL })}' opencode --standalone`,
    promptFlag: "--prompt",
  },
};
const MCP_CONFIG = ".agents/mcp_config.json";
const MCP_AGENTS = ["claude", "kiro-claude", "mimo-claude"];
const USAGE = `usage: pnpm orchestra <command>

Coordinate agent CLIs in tmux windows. Tasks are journal records under
journal/features/<feature>/tasks/<id>/ (brief.md, plan.md, log.md, report.md).

  init [feature]                                  register this pane as the session's orchestrator
  new <feature> <task> [--role implementer|reviewer|probe] [--gate none|plan] [--items P01-I01,..] [--grant 'glob,..']
                                                  create a draft task folder with brief.md
  path <task>                                     print a task's folder
  spawn <task> <agent> [--cwd DIR] [--cmd 'launch command'] [--arg] [--mcp name,..]
                                                  open window w:<task>, start the agent, deliver the worker prompt
  send <task> <message..> | --file PATH           deliver a message (a stopped worker is set running)
  go <task> [message..]                           approve a plan-ready worker's plan
  restart <task>                                  relaunch a worker with a fresh context and resume it from its log
  resume <task> [message..]                       continue a stopped worker; relaunch it if its window is gone
  peek <task> [lines]                             print the tail of a worker's screen
  close <task>                                    kill a worker's window; an unfinished task becomes closed
  status                                          tasks, their windows and context use
  reconcile [--respawn]                           align this session's task records with its windows
  watch [tasks..] [--follow] [--interval 10] [--idle 3] [--cap 60] [--match REGEX] [--timeout 0]
                                                  print unreported events; exit after the first poll with events
  diff <task>                                     list added, changed and removed paths since spawn
  accept <task> [--close] [--removed-title TITLE ...] [--without-title-guard]
                                                  accept a done task: set its items implemented with one report ref
  done <task> [done|blocked|failed|plan-ready|restart]
                                                  worker: set your task's status after writing its file
  handoff [prompt..] | --file PATH [--delay 20]    orchestrator: clear this pane after the turn and resume

agents: ${Object.keys(AGENTS).sort().join(", ")}, or any command`;

class OrchestraError extends Error {}

type Fields = Record<string, unknown>;
type Event = [string, string, string];

interface Task {
  id: string;
  feature: string;
  folder: string;
  brief: string;
}

interface Snapshot {
  top: string;
  head: string;
  branch: string;
  dirty: Record<string, string>;
}

interface Runtime {
  baseline?: Snapshot;
  test_titles?: string[];
  prompt_flag?: string | null;
  screens?: string[];
  flagged_paths?: string[];
  git_flagged?: boolean;
  matched_lines?: string[];
}

const pauseCell = new Int32Array(new SharedArrayBuffer(4));

const sleep = function (seconds: number) {
  Atomics.wait(pauseCell, 0, 0, Math.max(0, seconds * 1000));
};

const monotonic = function (): number {
  return performance.now() / 1000;
};

const run = function (
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; check?: boolean } = {},
): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf-8",
  });
  if (result.error) {
    throw new OrchestraError(`${command}: ${result.error.message}`);
  }
  if ((options.check ?? true) && result.status !== 0) {
    throw new OrchestraError(
      `${[command, ...args].join(" ")}: ${(result.stderr ?? "").trim()}`,
    );
  }
  return result.stdout ?? "";
};

const now = function (): string {
  const date = new Date();
  const pad = function (n: number) {
    return String(n).padStart(2, "0");
  };
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const warn = function (message: string) {
  console.error(`orchestra: warning: ${message}`);
};

const sha1 = function (text: string): string {
  return createHash("sha1").update(text).digest("hex");
};

const writeAtomically = function (path: string, content: string) {
  const staging = join(
    dirname(path),
    `.${path.split("/").pop()}.${process.pid}`,
  );
  writeFileSync(staging, content);
  renameSync(staging, path);
};

const splitCsv = function (text: string | undefined): string[] {
  return (text ?? "")
    .split(",")
    .map(function (part) {
      return part.trim();
    })
    .filter(Boolean);
};

const asList = function (value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    return splitCsv(value);
  }
  return [];
};

const isDirectory = function (path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

const isFile = function (path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

const lexists = function (path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};

let rootCache = "";

const realPath = function (path: string): string {
  try {
    return realpathSync(resolve(path));
  } catch {
    return resolve(path);
  }
};

const root = function (): string {
  if (rootCache) return rootCache;
  const configured = process.env.ORCHESTRA_ROOT;
  if (configured) {
    rootCache = realPath(configured);
    return rootCache;
  }
  const top = run("git", ["rev-parse", "--show-toplevel"], {
    check: false,
  }).trim();
  if (!top) {
    throw new OrchestraError(
      "not inside a git repository (run from the repo or set ORCHESTRA_ROOT)",
    );
  }
  rootCache = realPath(top);
  return rootCache;
};

const featuresDir = function (): string {
  return join(root(), "journal", "features");
};

const taskAt = function (folder: string): Task {
  return {
    id: folder.split("/").pop()!,
    feature: dirname(dirname(folder)).split("/").pop()!,
    folder,
    brief: join(folder, "brief.md"),
  };
};

const taskFile = function (task: Task, name: string): string {
  return join(task.folder, name);
};

const readTask = function (task: Task): { fields: Fields; body: string } {
  if (!existsSync(task.brief)) return { fields: {}, body: "" };
  const text = readFileSync(task.brief, "utf-8");
  const match = text.match(FRONTMATTER);
  if (!match) return { fields: {}, body: text };
  let parsed: unknown;
  try {
    parsed = parseYaml(match[1] ?? "", { schema: "failsafe" });
  } catch (error) {
    throw new OrchestraError(
      `${task.brief}: unreadable frontmatter: ${(error as Error).message.split("\n")[0]}`,
    );
  }
  if (
    parsed !== null &&
    (typeof parsed !== "object" || Array.isArray(parsed))
  ) {
    throw new OrchestraError(`${task.brief}: frontmatter is not a mapping`);
  }
  return {
    fields: (parsed as Fields) ?? {},
    body: text.slice(match[0].length),
  };
};

const writeTask = function (task: Task, fields: Fields, body: string) {
  const keys = [
    ...FIELD_ORDER,
    ...Object.keys(fields).filter(function (key) {
      return !FIELD_ORDER.includes(key);
    }),
  ];
  const lines = keys.map(function (key) {
    const fallback = LIST_FIELDS.includes(key) ? [] : "";
    return `${key}: ${JSON.stringify(fields[key] ?? fallback)}`;
  });
  writeAtomically(task.brief, `---\n${lines.join("\n")}\n---\n${body}`);
};

const updateTask = function (task: Task, changes: Fields, appendToBody = "") {
  const { fields, body } = readTask(task);
  writeTask(task, { ...fields, ...changes }, body + appendToBody);
};

const taskGet = function (task: Task, key: string): string {
  const value = readTask(task).fields[key];
  return typeof value === "string" ? value : "";
};

const taskList = function (task: Task, key: string): string[] {
  return asList(readTask(task).fields[key]);
};

const taskStatus = function (task: Task): string {
  return taskGet(task, "status") || "draft";
};

const allTasks = function (): Task[] {
  const tasks: Task[] = [];
  const features = featuresDir();
  if (!isDirectory(features)) return tasks;
  for (const feature of readdirSync(features).sort()) {
    const tasksDir = join(features, feature, "tasks");
    if (!isDirectory(tasksDir)) continue;
    for (const id of readdirSync(tasksDir).sort()) {
      if (isDirectory(join(tasksDir, id)))
        tasks.push(taskAt(join(tasksDir, id)));
    }
  }
  return tasks;
};

const checkTaskId = function (taskId: string) {
  if (!/^[a-z0-9-]+$/.test(taskId)) {
    throw new OrchestraError(
      `task id must be kebab-case: ${JSON.stringify(taskId)}`,
    );
  }
};

const findTask = function (taskId: string | undefined): Task {
  if (!taskId) throw new OrchestraError("missing task id");
  checkTaskId(taskId);
  const matches = allTasks().filter(function (task) {
    return task.id === taskId;
  });
  const [task, ...others] = matches;
  if (!task) {
    throw new OrchestraError(
      `no task '${taskId}' under journal/features/*/tasks/ (create it with: pnpm orchestra new <feature> ${taskId})`,
    );
  }
  if (others.length > 0) {
    throw new OrchestraError(`task id '${taskId}' exists in several features`);
  }
  return task;
};

// @claim infra/orchestra
const taskProblem = function (task: Task): string | null {
  try {
    readTask(task);
    return null;
  } catch (error) {
    if (!(error instanceof OrchestraError)) throw error;
    return error.message;
  }
};

const readableTasks = function (tasks: Task[]): Task[] {
  return tasks.filter(function (task) {
    return taskProblem(task) === null;
  });
};

const briefHasContent = function (body: string): boolean {
  return body.split("\n").some(function (line) {
    return line.trim() !== "" && !line.trimStart().startsWith("#");
  });
};

const tmuxOutput = function (
  args: string[],
  options: { check?: boolean; input?: string } = {},
): string {
  if (!process.env.TMUX) throw new OrchestraError("not inside tmux");
  return run("tmux", args, options);
};

const tmux = function (
  args: string[],
  options: { check?: boolean; input?: string } = {},
): string {
  return tmuxOutput(args, options).trim();
};

let sessionCache = "";

const currentSession = function (): string {
  if (!sessionCache)
    sessionCache = tmux(["display-message", "-p", "#{session_name}"]);
  return sessionCache;
};

const sessionOption = function (name: string): string {
  return tmux(["show-options", "-qv", name], { check: false });
};

const windowOption = function (pane: string, name: string): string {
  return tmux(["show-options", "-wqv", "-t", pane, name], { check: false });
};

const setWindowOption = function (pane: string, name: string, value: string) {
  tmux(["set-option", "-w", "-t", pane, name, value]);
};

const unsetWindowOption = function (pane: string, name: string) {
  tmux(["set-option", "-wu", "-t", pane, name], { check: false });
};

const workerPanes = function (): Record<string, string> {
  const panes: Record<string, string> = {};
  for (const line of tmux([
    "list-windows",
    "-F",
    "#{window_name}\t#{pane_id}",
  ]).split("\n")) {
    const [name, pane] = line.split("\t");
    if (name?.startsWith("w:") && pane) panes[name.slice(2)] = pane;
  }
  return panes;
};

const paneOf = function (taskId: string): string | undefined {
  return workerPanes()[taskId];
};

const requirePane = function (task: Task): string {
  const pane = paneOf(task.id);
  if (!pane) {
    throw new OrchestraError(
      `task ${task.id} has no live window w:${task.id} in this session`,
    );
  }
  return pane;
};

const paneSession = function (pane: string): string {
  return tmux(["display-message", "-p", "-t", pane, "#{session_name}"]);
};

const paneAtShell = function (pane: string): boolean {
  const shell = tmux(["display-message", "-p", "-t", pane, "#{pane_pid}"]);
  const [group, foreground] = run(
    "ps",
    ["-o", "pgid=", "-o", "tpgid=", "-p", shell],
    { check: false },
  )
    .trim()
    .split(/\s+/);
  return Boolean(group) && group === foreground;
};

const capture = function (pane: string, historyLines = 0): string {
  const history = historyLines ? ["-S", `-${historyLines}`] : [];
  return tmuxOutput(["capture-pane", "-p", "-J", "-t", pane, ...history])
    .split("\n")
    .map(function (line) {
      return line.trimEnd();
    })
    .join("\n")
    .trimEnd();
};

const normalized = function (screen: string): string {
  return screen.replace(/\d/g, "#");
};

const fingerprint = function (screen: string): string {
  return sha1(normalized(screen));
};

const squashWhitespace = function (text: string): string {
  return text.split(/\s+/).filter(Boolean).join(" ");
};

const isBusy = function (screen: string): boolean {
  return BUSY.test(screen.split("\n").slice(-BUSY_TAIL_LINES).join("\n"));
};

const openDialog = function (screen: string): string | null {
  const tail = screen.trimEnd().split("\n").slice(-DIALOG_TAIL_LINES);
  const line = tail.find(function (candidate) {
    return DIALOG.test(candidate);
  });
  return line === undefined ? null : line.trim();
};

const lastMatch = function (
  pattern: RegExp,
  text: string,
): RegExpMatchArray | null {
  const found = [...text.matchAll(pattern)];
  return found[found.length - 1] ?? null;
};

const contextUsed = function (screen: string): number | null {
  const usedOf = lastMatch(CONTEXT_USED_OF, screen);
  if (usedOf) return Number(usedOf[1]);
  const named = lastMatch(CONTEXT_NAMED_FIRST, screen);
  if (named)
    return named[2] === "left" ? 100 - Number(named[1]) : Number(named[1]);
  const percent = lastMatch(CONTEXT_PERCENT, screen);
  if (percent)
    return percent[2] ? 100 - Number(percent[1]) : Number(percent[1]);
  const left = lastMatch(CONTEXT_LEFT_UNTIL_COMPACT, screen);
  if (left) return 100 - Number(left[1]);
  const tokens = lastMatch(CONTEXT_TOKENS_PERCENT, screen);
  if (tokens) return Number(tokens[1]);
  return null;
};

const contextLabel = function (pane: string | undefined): string {
  const used = pane ? contextUsed(capture(pane, SCREEN_HISTORY_LINES)) : null;
  return used === null ? "-" : `${used}%`;
};

const typeKeys = function (pane: string, text: string) {
  tmux(["send-keys", "-t", pane, "-l", text]);
  sleep(0.5);
  tmux(["send-keys", "-t", pane, "Enter"]);
};

const isSlashCommand = function (text: string): boolean {
  return text.trim().startsWith("/") && !text.trim().includes("\n");
};

// @claim infra/orchestra
const deliver = function (
  pane: string,
  text: string,
  label: string,
  preserve = false,
) {
  if (isSlashCommand(text)) {
    typeKeys(pane, text.trim());
    return;
  }
  const dialog = openDialog(capture(pane));
  if (dialog !== null) {
    throw new OrchestraError(
      `a dialog is open in ${label} ("${dialog}"); answer it in the window, then retry`,
    );
  }
  const content = preserve ? text : text.trimEnd();
  const buffer = `orchestra-${process.pid}`;
  tmux(["load-buffer", "-b", buffer, "-"], { input: content });
  tmux(["paste-buffer", "-d", "-p", "-b", buffer, "-t", pane]);
  const expected = squashWhitespace(content).slice(0, VISIBLE_PREFIX_CHARS);
  const deadline = monotonic() + PASTE_VISIBLE_TIMEOUT_SECONDS;
  for (;;) {
    sleep(0.25);
    const screen = capture(pane);
    if (
      squashWhitespace(screen).includes(expected) ||
      PASTED_PLACEHOLDER.test(screen)
    )
      break;
    if (monotonic() > deadline) {
      const tail = screen.split("\n").slice(-8).join("\n");
      throw new OrchestraError(
        `prompt not visible in ${label} (a dialog may be open); last lines:\n${tail}`,
      );
    }
  }
  const pasted = fingerprint(capture(pane));
  for (let attempt = 0; attempt < SUBMIT_ATTEMPTS; attempt += 1) {
    sleep(0.5);
    tmux(["send-keys", "-t", pane, "Enter"]);
    const submitDeadline = monotonic() + SUBMIT_WAIT_SECONDS;
    while (monotonic() < submitDeadline) {
      sleep(0.25);
      const screen = capture(pane);
      if (isBusy(screen) || fingerprint(screen) !== pasted) return;
    }
  }
  throw new OrchestraError(
    `the message was pasted into ${label} but not submitted after ${SUBMIT_ATTEMPTS} Enter presses; submit it in the window`,
  );
};

const waitForSteadyScreen = function (
  pane: string,
  options: {
    equalPolls: number;
    interval: number;
    timeout: number;
    needsAgent?: boolean;
    needsCalm?: boolean;
  },
): boolean {
  const deadline = monotonic() + options.timeout;
  let previous = "";
  let streak = 0;
  while (monotonic() < deadline) {
    sleep(options.interval);
    const screen = capture(pane);
    const waiting =
      !screen.trim() ||
      (options.needsAgent === true && paneAtShell(pane)) ||
      (options.needsCalm === true && isBusy(screen));
    const current = waiting ? "" : fingerprint(screen);
    streak = current && current === previous ? streak + 1 : current ? 1 : 0;
    previous = current;
    if (streak >= options.equalPolls) return true;
  }
  return false;
};

const waitUntilReady = function (
  pane: string,
  label: string,
  fallback: string,
) {
  const ready = waitForSteadyScreen(pane, {
    equalPolls: 3,
    interval: 1,
    timeout: READY_TIMEOUT_SECONDS,
    needsAgent: true,
  });
  if (!ready) {
    throw new OrchestraError(
      `the agent in ${label} was not ready after ${READY_TIMEOUT_SECONDS} s; deliver the prompt by hand: ${fallback}`,
    );
  }
};

const runtimeFile = function (task: Task): string {
  const session = taskGet(task, "session") || currentSession();
  const uid = process.getuid ? process.getuid() : 0;
  return join(
    tmpdir(),
    `orchestra-${uid}`,
    sha1(session).slice(0, 10),
    `${task.id}.json`,
  );
};

const loadRuntime = function (task: Task): Runtime {
  try {
    return JSON.parse(readFileSync(runtimeFile(task), "utf-8")) as Runtime;
  } catch {
    return {};
  }
};

const saveRuntime = function (task: Task, state: Runtime) {
  const path = runtimeFile(task);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeAtomically(path, JSON.stringify(state, null, 1));
};

const updateRuntime = function (task: Task, changes: Runtime) {
  saveRuntime(task, { ...loadRuntime(task), ...changes });
};

const savePrompt = function (task: Task, prompt: string): string {
  const path = join(dirname(runtimeFile(task)), `${task.id}.prompt.md`);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${prompt}\n`);
  return path;
};

const repoTops = new Map<string, string>();

const repoTop = function (cwd: string): string {
  if (!cwd) return "";
  if (!repoTops.has(cwd)) {
    const top = run("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      check: false,
    }).trim();
    repoTops.set(cwd, top ? realPath(top) : "");
  }
  return repoTops.get(cwd)!;
};

// @claim infra/orchestra-watch
const dirtyFiles = function (top: string): Record<string, string> {
  const entries = run("git", [
    "-C",
    top,
    "status",
    "--porcelain",
    "-z",
    "--untracked-files=all",
  ]).split("\0");
  const paths: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] ?? "";
    if (entry.length < 4) continue;
    const code = entry.slice(0, 2);
    paths.push(entry.slice(3));
    if (code.includes("R")) paths.push(entries[++i] ?? "");
    else if (code.includes("C")) i++;
  }
  const hashable = paths.filter(function (path) {
    return path && !path.includes("\n") && isFile(join(top, path));
  });
  const hashes = new Map<string, string>();
  if (hashable.length > 0) {
    const result = spawnSync(
      "git",
      ["-C", top, "hash-object", "--stdin-paths"],
      {
        input: hashable
          .map(function (path) {
            return `${path}\n`;
          })
          .join(""),
        encoding: "utf-8",
      },
    );
    const blobs = (result.stdout ?? "").trim().split("\n");
    if (
      result.status === 0 &&
      blobs.length === hashable.length &&
      blobs.every(function (blob) {
        return /^[0-9a-f]{40}$/.test(blob);
      })
    ) {
      hashable.forEach(function (path, index) {
        hashes.set(path, blobs[index]!);
      });
    }
  }
  const dirty: Record<string, string> = {};
  for (const path of paths) {
    if (!path) continue;
    if (!isFile(join(top, path))) {
      dirty[path] = lexists(join(top, path)) ? "not-a-file" : "deleted";
      continue;
    }
    const hash =
      hashes.get(path) ??
      run("git", ["-C", top, "hash-object", "--", path], {
        check: false,
      }).trim();
    dirty[path] = /^[0-9a-f]{40}$/.test(hash)
      ? hash
      : lexists(join(top, path))
        ? "not-a-file"
        : "deleted";
  }
  return dirty;
};

const repoSnapshot = function (top: string): Snapshot {
  return {
    top,
    head: run("git", ["-C", top, "rev-parse", "--verify", "-q", "HEAD"], {
      check: false,
    }).trim(),
    branch: run("git", ["-C", top, "symbolic-ref", "-q", "--short", "HEAD"], {
      check: false,
    }).trim(),
    dirty: dirtyFiles(top),
  };
};

const takeBaseline = function (cwd: string): Snapshot {
  const top = repoTop(cwd);
  return top ? repoSnapshot(top) : { top: "", head: "", branch: "", dirty: {} };
};

// @claim infra/orchestra
const testTitles = function (top: string): string[] {
  const files = run("git", [
    "-C",
    top,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ])
    .split("\0")
    .filter(function (path) {
      return (
        /\.(?:live\.)?(?:test|bench)\.tsx?$/.test(path) &&
        isFile(join(top, path))
      );
    });
  const titles = new Set<string>();
  const testCall = function (expression: ts.Expression): boolean {
    if (ts.isIdentifier(expression))
      return expression.text === "it" || expression.text === "test";
    if (ts.isCallExpression(expression)) return testCall(expression.expression);
    if (!ts.isPropertyAccessExpression(expression)) return false;
    if (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "Deno"
    ) {
      return (
        expression.name.text === "test" || expression.name.text === "bench"
      );
    }
    return (
      ["skip", "only", "todo", "each", "ignore"].includes(
        expression.name.text,
      ) && testCall(expression.expression)
    );
  };
  for (const path of files) {
    const source = ts.createSourceFile(
      path,
      readFileSync(join(top, path), "utf-8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = function (node: ts.Node): void {
      if (ts.isCallExpression(node)) {
        if (testCall(node.expression)) {
          const first = node.arguments[0];
          if (
            first &&
            (ts.isStringLiteral(first) ||
              ts.isNoSubstitutionTemplateLiteral(first))
          ) {
            titles.add(first.text);
          } else if (first && ts.isObjectLiteralExpression(first)) {
            const property = first.properties.find(function (entry) {
              return (
                ts.isPropertyAssignment(entry) &&
                entry.name.getText(source) === "name"
              );
            });
            if (
              property &&
              ts.isPropertyAssignment(property) &&
              (ts.isStringLiteral(property.initializer) ||
                ts.isNoSubstitutionTemplateLiteral(property.initializer))
            ) {
              titles.add(property.initializer.text);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return [...titles].sort();
};

const committedSince = function (
  baseline: Snapshot,
  current: Snapshot,
): string[] {
  if (!baseline.head || !current.head || baseline.head === current.head)
    return [];
  return run(
    "git",
    [
      "-C",
      current.top,
      "diff",
      "--name-only",
      "-z",
      baseline.head,
      current.head,
    ],
    { check: false },
  )
    .split("\0")
    .filter(function (path) {
      if (!path) return false;
      const before = baseline.dirty[path];
      if (before === undefined) return true;
      const committed = run(
        "git",
        [
          "-C",
          current.top,
          "rev-parse",
          "-q",
          "--verify",
          `${current.head}:${path}`,
        ],
        { check: false },
      ).trim();
      return committed !== before;
    });
};

// @claim infra/orchestra-watch
const changedSince = function (
  baseline: Snapshot | undefined,
  current: Snapshot,
): string[] {
  const before = baseline?.dirty ?? {};
  const dirtyPaths = new Set([
    ...Object.keys(before),
    ...Object.keys(current.dirty),
  ]);
  const uncommitted = [...dirtyPaths]
    .filter(function (path) {
      const currentBlob = current.dirty[path];
      if (currentBlob !== undefined) return before[path] !== currentBlob;
      const headBlob = current.head
        ? run(
            "git",
            [
              "-C",
              current.top,
              "rev-parse",
              "-q",
              "--verify",
              `${current.head}:${path}`,
            ],
            { check: false },
          ).trim()
        : "";
      return before[path] !== headBlob;
    })
    .map(function (path) {
      return path;
    });
  const committed = baseline ? committedSince(baseline, current) : [];
  return [...new Set([...uncommitted, ...committed])].sort();
};

const describeGitMoves = function (
  baseline: Snapshot,
  current: Snapshot,
): string {
  const moves: string[] = [];
  if (current.head !== (baseline.head ?? "")) {
    moves.push(
      `HEAD moved ${(baseline.head ?? "").slice(0, 10) || "(none)"} -> ${current.head.slice(0, 10) || "(none)"}`,
    );
  }
  if (current.branch !== (baseline.branch ?? "")) {
    moves.push(
      `branch ${baseline.branch || "(detached)"} -> ${current.branch || "(detached)"}`,
    );
  }
  return moves.join("; ");
};

const expandBraces = function (pattern: string): string[] {
  const match = pattern.match(/\{([^{}]*)\}/);
  if (!match || match.index === undefined) return [pattern];
  const head = pattern.slice(0, match.index);
  const tail = pattern.slice(match.index + match[0].length);
  return (match[1] ?? "").split(",").flatMap(function (option) {
    return expandBraces(head + option + tail);
  });
};

const WILDCARDS: Record<string, string> = {
  "**/": "(?:.*/)?",
  "**": ".*",
  "*": "[^/]*",
  "?": "[^/]",
};

const globRegex = function (pattern: string): RegExp {
  const trimmed = pattern
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+|\/+$/g, "");
  const source = trimmed
    .split(/(\*\*\/|\*\*|\*|\?)/)
    .map(function (token) {
      return WILDCARDS[token] ?? token.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^${source}(?:/.*)?$`);
};

const matchesAny = function (path: string, globs: string[]): boolean {
  return globs.some(function (glob) {
    return expandBraces(glob).some(function (expanded) {
      return globRegex(expanded).test(path);
    });
  });
};

// @claim infra/orchestra-watch
const allowedGlobs = function (
  task: Task,
  top: string,
  tasks: Task[],
): string[] {
  const started = taskGet(task, "started");
  const sharingRepo = [
    task,
    ...tasks.filter(function (other) {
      const otherStarted = taskGet(other, "started");
      const otherFinished = taskGet(other, "finished");
      return (
        other.id !== task.id &&
        (Boolean(otherStarted) || taskStatus(other) === "running") &&
        (!started || !otherFinished || otherFinished >= started) &&
        repoTop(taskGet(other, "cwd")) === top
      );
    }),
  ];
  const globs = [...JOURNAL_FILES_THE_ORCHESTRATOR_WRITES];
  for (const member of sharingRepo) {
    globs.push(...taskList(member, "grant"));
  }
  return globs;
};

const journalSet = function (
  feature: string,
  item: string,
  state: string,
  refs: string[] = [],
  role = "changed",
) {
  const args = [
    "run",
    "-A",
    join(root(), "tooling", "journal.ts"),
    "set",
    feature,
    item,
    state,
    ...refs.flatMap(function (ref) {
      return ["--ref", `${ref}=${role}`];
    }),
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: root(),
    encoding: "utf-8",
  });
  if (result.error) {
    warn(
      `journal.ts set ${feature} ${item} ${state}: ${result.error.message}; update the plan item by hand`,
    );
    return;
  }
  if (result.status !== 0) {
    const reason =
      (result.stderr || result.stdout || "").trim().split("\n").pop() ||
      `exit ${result.status}`;
    warn(
      `journal.ts set ${feature} ${item} ${state} failed: ${reason}; update the plan item by hand`,
    );
  }
};

const workerPrompt = function (task: Task): string {
  return `You are the orchestra worker for task '${task.id}' (${taskGet(task, "role") || "implementer"}). Follow ${join(root(), WORKER_PROTOCOL)}. Your brief is ${task.brief}; write plan.md, log.md and report.md next to it.`;
};

const resumePrompt = function (task: Task): string {
  return `Resume orchestra task '${task.id}': reread ${join(root(), WORKER_PROTOCOL)}, your brief ${task.brief} (including any ## Go and ## Resume sections) and your log ${taskFile(task, "log.md")}, then continue where the log ends.`;
};

const openWorkerWindow = function (task: Task, cwd: string): string {
  return tmux([
    "new-window",
    "-d",
    "-P",
    "-F",
    "#{pane_id}",
    "-n",
    `w:${task.id}`,
    "-c",
    cwd,
    "-e",
    `ORCHESTRA_ROOT=${root()}`,
    "-e",
    `ORCHESTRA_TASK=${task.id}`,
  ]);
};

const shellQuote = function (text: string): string {
  return `'${text.replace(/'/g, "'\\''")}'`;
};

// @claim infra/orchestra
const commandWithPrompt = function (
  command: string,
  executable: string,
  promptFlag: string,
  promptFile: string,
): string {
  const escaped = executable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...command.matchAll(
      new RegExp(`(^|\\s)(?:[^\\s]*/)?${escaped}(?=\\s|$)`, "g"),
    ),
  ];
  if (matches.length !== 1)
    throw new OrchestraError(
      `cannot locate one ${executable} executable in --cmd; use a command with an unquoted agent executable or omit --arg`,
    );
  const match = matches[0]!;
  const end = (match.index ?? 0) + match[0].length;
  const flag = promptFlag ? `${promptFlag} ` : "";
  return `${command.slice(0, end)} ${flag}"$(cat ${shellQuote(promptFile)})"${command.slice(end)}`;
};

// @claim infra/orchestra
const promptInForeground = function (pane: string, prompt: string): boolean {
  const shell = tmux(["display-message", "-p", "-t", pane, "#{pane_pid}"]);
  const groups = run("ps", ["-o", "tpgid=", "-p", shell], {
    check: false,
  }).trim();
  if (!/^\d+$/.test(groups)) return false;
  const processes = run("ps", ["-eww", "-o", "pgid=,args="], { check: false });
  return processes.split("\n").some(function (line) {
    const match = line.match(/^\s*(\d+)\s+(.*)$/);
    return match?.[1] === groups && match[2]?.includes(prompt);
  });
};

const promptFlagOf = function (
  agent: string,
  command: string,
  asArgument: boolean,
): string | null {
  const known = AGENTS[agent];
  if (known !== undefined && command.split(/\s+/).includes(known.executable))
    return known.promptFlag;
  return asArgument ? "" : null;
};

const waitForLaunch = function (pane: string, label: string) {
  const deadline = monotonic() + LAUNCH_TIMEOUT_SECONDS;
  while (monotonic() < deadline) {
    sleep(0.5);
    if (!paneAtShell(pane)) return;
  }
  const tail = capture(pane).split("\n").slice(-8).join("\n");
  throw new OrchestraError(
    `the agent in ${label} did not start within ${LAUNCH_TIMEOUT_SECONDS} s; last lines:\n${tail}`,
  );
};

const launchAgent = function (
  task: Task,
  pane: string,
  command: string,
  prompt: string,
  promptFlag: string | null,
) {
  const promptFile = savePrompt(task, prompt);
  sleep(0.5);
  if (promptFlag !== null) {
    const executable =
      AGENTS[taskGet(task, "agent")]?.executable ?? taskGet(task, "agent");
    typeKeys(
      pane,
      commandWithPrompt(command, executable, promptFlag, promptFile),
    );
    waitForLaunch(pane, `w:${task.id}`);
    const deadline = monotonic() + PASTE_VISIBLE_TIMEOUT_SECONDS;
    while (monotonic() < deadline) {
      if (promptInForeground(pane, prompt)) return;
      sleep(0.25);
    }
    throw new OrchestraError(
      `prompt did not reach the agent in w:${task.id}; prompt saved at ${promptFile}`,
    );
    return;
  }
  typeKeys(pane, command);
  waitUntilReady(
    pane,
    `w:${task.id}`,
    `pnpm orchestra send ${task.id} --file ${promptFile}`,
  );
  deliver(pane, prompt, `w:${task.id}`);
};

const respawnWorker = function (task: Task) {
  const command = taskGet(task, "command");
  if (!command) throw new OrchestraError("no recorded command");
  const cwd = taskGet(task, "cwd") || root();
  if (!isDirectory(cwd)) throw new OrchestraError(`cwd does not exist: ${cwd}`);
  const pane = openWorkerWindow(task, cwd);
  updateTask(task, {
    status: "running",
    started: taskGet(task, "started") || now(),
    finished: "",
    reported: "",
  });
  const state = loadRuntime(task);
  saveRuntime(task, {
    ...state,
    baseline: state.baseline ?? takeBaseline(cwd),
    screens: [],
  });
  launchAgent(
    task,
    pane,
    command,
    resumePrompt(task),
    state.prompt_flag !== undefined
      ? state.prompt_flag
      : promptFlagOf(taskGet(task, "agent"), command, false),
  );
};

// @claim infra/orchestra-watch
const reconcile = function (respawn: boolean): string[] {
  const session = currentSession();
  const panes = workerPanes();
  const changes: string[] = [];
  for (const task of readableTasks(allTasks())) {
    if (taskGet(task, "session") !== session) continue;
    const status = taskStatus(task);
    const live = task.id in panes;
    if ((status === "running" || status === "lost") && !live && respawn) {
      try {
        respawnWorker(task);
        changes.push(
          `${task.id}: respawned in w:${task.id} with the resume prompt`,
        );
      } catch (error) {
        if (!(error instanceof OrchestraError)) throw error;
        changes.push(`${task.id}: respawn failed: ${error.message}`);
      }
    } else if (status === "running" && !live) {
      updateTask(task, { status: "lost", finished: now() });
      changes.push(
        `${task.id}: window w:${task.id} is gone; marked lost (\`pnpm orchestra reconcile --respawn\` relaunches it)`,
      );
    } else if (status === "lost" && live) {
      updateTask(task, { status: "running", finished: "", reported: "" });
      changes.push(`${task.id}: window w:${task.id} is back; marked running`);
    }
  }
  return changes;
};

// @claim infra/orchestra-watch
const recordEvents = function (task: Task): Event[] {
  const status = taskStatus(task);
  if (!EVENT_STATUSES.includes(status) || taskGet(task, "reported") === status)
    return [];
  updateTask(task, { reported: status });
  const detail =
    status === "lost"
      ? `window w:${task.id} is gone; \`pnpm orchestra reconcile --respawn\` relaunches it`
      : taskFile(task, WORKER_FILE_FOR_STATUS[status] ?? "report.md");
  return [[task.id, status, detail]];
};

const contextCrossedCap = function (
  pane: string,
  used: number,
  cap: number,
): boolean {
  const flagged = windowOption(pane, "@orchestra_ctx");
  let lastFlagged = /^\d+$/.test(flagged) ? Number(flagged) : null;
  if (
    lastFlagged !== null &&
    used < lastFlagged - CONTEXT_DROP_MEANING_CLEARED
  ) {
    unsetWindowOption(pane, "@orchestra_ctx");
    lastFlagged = null;
  }
  if (used >= cap && (lastFlagged === null || used > lastFlagged)) {
    setWindowOption(pane, "@orchestra_ctx", String(used));
    return true;
  }
  return false;
};

// @claim infra/orchestra-watch
const matchEvents = function (
  task: Task,
  screen: string,
  match: RegExp,
): Event[] {
  const seen = loadRuntime(task).matched_lines ?? [];
  const events: Event[] = [];
  for (const line of screen.split("\n")) {
    const text = squashWhitespace(line);
    if (!match.test(text)) continue;
    const key = sha1(text);
    if (seen.includes(key)) continue;
    seen.push(key);
    events.push([task.id, "match", text.slice(0, MATCH_DETAIL_CHARS)]);
  }
  if (events.length > 0)
    updateRuntime(task, { matched_lines: seen.slice(-MATCHED_LINES_KEPT) });
  return events;
};

// @claim infra/orchestra-watch
const screenEvents = function (
  task: Task,
  pane: string,
  cap: number,
  idlePolls: number,
  match: RegExp | null,
): Event[] {
  const screen = capture(pane, SCREEN_HISTORY_LINES);
  const events: Event[] =
    match === null ? [] : matchEvents(task, screen, match);
  const used = contextUsed(screen);
  if (used !== null && contextCrossedCap(pane, used, cap)) {
    events.push([
      task.id,
      "context",
      `${used}% of the context window used (cap ${cap}%)`,
    ]);
  }
  const dialog = openDialog(screen);
  if (dialog === null) unsetWindowOption(pane, "@orchestra_dialog");
  if (dialog !== null && windowOption(pane, "@orchestra_dialog") !== dialog) {
    setWindowOption(pane, "@orchestra_dialog", dialog);
    events.push([
      task.id,
      "dialog",
      `the agent is waiting on a dialog ("${dialog}"); answer it in w:${task.id}`,
    ]);
  }
  const recent = isBusy(screen)
    ? []
    : [...(loadRuntime(task).screens ?? []), fingerprint(screen)].slice(
        -idlePolls,
      );
  updateRuntime(task, { screens: recent });
  const steady = recent.length === idlePolls && new Set(recent).size === 1;
  const stable = recent[0];
  if (steady && stable && windowOption(pane, "@orchestra_idle") !== stable) {
    setWindowOption(pane, "@orchestra_idle", stable);
    const detail = paneAtShell(pane)
      ? "the agent exited; the window is at a shell prompt"
      : `screen unchanged for ${idlePolls} polls and no \`pnpm orchestra done\`; \`pnpm orchestra peek ${task.id}\``;
    events.push([task.id, "idle", detail]);
  }
  return events;
};

// @claim infra/orchestra-watch
const repoEvents = function (
  task: Task,
  tasks: Task[],
  snapshots: Map<string, Snapshot>,
): Event[] {
  const state = loadRuntime(task);
  const baseline = state.baseline;
  const top = baseline?.top;
  if (!baseline || !top) return [];
  if (!snapshots.has(top)) snapshots.set(top, repoSnapshot(top));
  const current = snapshots.get(top)!;
  const flagged = new Set(state.flagged_paths ?? []);
  const allowed = allowedGlobs(task, top, tasks);
  const outside = changedSince(baseline, current).filter(function (path) {
    return !flagged.has(path) && !matchesAny(path, allowed);
  });
  const events: Event[] = outside.map(function (path) {
    return [task.id, "scope", `${path} changed outside the grant`];
  });
  const moves = describeGitMoves(baseline, current);
  const newlyMoved = Boolean(moves) && !state.git_flagged;
  if (newlyMoved) events.push([task.id, "git", moves]);
  if (events.length > 0) {
    updateRuntime(task, {
      flagged_paths: [...new Set([...flagged, ...outside])].sort(),
      git_flagged: Boolean(state.git_flagged) || newlyMoved,
    });
  }
  return events;
};

const printTable = function (rows: string[][]) {
  const widths = (rows[0] ?? []).map(function (_cell, column) {
    return Math.max(
      ...rows.map(function (row) {
        return (row[column] ?? "").length;
      }),
    );
  });
  for (const row of rows) {
    const leading = row.slice(0, -1).map(function (cell, column) {
      return cell.padEnd(widths[column] ?? 0);
    });
    console.log(`${leading.join("  ")}  ${row[row.length - 1]}`);
  }
};

interface Parsed {
  positionals: string[];
  values: Record<string, string | boolean | undefined>;
}

const numberOption = function (value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new OrchestraError(`not a number: ${value}`);
  return parsed;
};

const cmdInit = function (parsed: Parsed) {
  const { positionals } = parsed;
  const feature = positionals[0];
  const session = currentSession();
  const pane = process.env.TMUX_PANE ?? "";
  if (!pane)
    throw new OrchestraError("not inside tmux ($TMUX_PANE is not set)");
  if (feature && !isDirectory(join(featuresDir(), feature))) {
    throw new OrchestraError(`no feature journal/features/${feature}/`);
  }
  tmux(["set-option", "@orchestra_pane", pane]);
  if (feature) tmux(["set-option", "@orchestra_feature", feature]);
  console.log(
    `orchestrator pane ${pane} for session ${session}${feature ? `, feature ${feature}` : ""}`,
  );
};

const cmdNew = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const [feature, taskId] = positionals;
  if (!feature || !taskId) throw new OrchestraError(USAGE);
  checkTaskId(taskId);
  const role = (values.role as string | undefined) ?? "implementer";
  const gate = (values.gate as string | undefined) ?? "none";
  if (!ROLES.includes(role))
    throw new OrchestraError(`role must be ${ROLES.join("|")}`);
  if (!GATES.includes(gate))
    throw new OrchestraError(`gate must be ${GATES.join("|")}`);
  const featureDir = join(featuresDir(), feature);
  if (!isDirectory(featureDir))
    throw new OrchestraError(`no feature journal/features/${feature}/`);
  if (
    allTasks().some(function (task) {
      return task.id === taskId;
    })
  ) {
    throw new OrchestraError(`task id '${taskId}' already exists`);
  }
  const items = splitCsv(values.items as string | undefined);
  if (items.length > 0) {
    const plan = join(featureDir, "plan.md");
    const known = new Set(
      existsSync(plan)
        ? [...readFileSync(plan, "utf-8").matchAll(PLAN_ITEM_HEADING)].map(
            function (m) {
              return m[1];
            },
          )
        : [],
    );
    const unknown = items.filter(function (item) {
      return !known.has(item);
    });
    if (unknown.length > 0) {
      throw new OrchestraError(
        `no such plan item in ${plan}: ${unknown.join(", ")}`,
      );
    }
  }
  const task = taskAt(join(featureDir, "tasks", taskId));
  mkdirSync(task.folder, { recursive: true });
  writeTask(
    task,
    {
      status: "draft",
      role,
      gate,
      items,
      grant: splitCsv(values.grant as string | undefined),
    },
    `# ${taskId}\n\n## Objective\n\n## Acceptance\n\n## Context\n\n## Scope\n`,
  );
  console.log(task.folder);
};

const cmdPath = function (parsed: Parsed) {
  console.log(findTask(parsed.positionals[0]).folder);
};

const mcpArguments = function (agent: string, names: string[]): string {
  if (!MCP_AGENTS.includes(agent)) {
    if (names.length > 0) {
      throw new OrchestraError(
        `--mcp is for ${MCP_AGENTS.join(", ")}; ${agent} takes its MCP servers from its own configuration`,
      );
    }
    return "";
  }
  const servers = (
    JSON.parse(readFileSync(join(root(), MCP_CONFIG), "utf-8")) as {
      mcpServers: Record<string, unknown>;
    }
  ).mcpServers;
  const missing = names.filter(function (name) {
    return !(name in servers);
  });
  if (missing.length > 0) {
    throw new OrchestraError(
      `no MCP server named ${missing.join(", ")} in ${MCP_CONFIG} (known: ${Object.keys(servers).join(", ")})`,
    );
  }
  const selected = Object.fromEntries(
    names.map(function (name) {
      return [name, servers[name]];
    }),
  );
  const config = JSON.stringify({ mcpServers: selected }).replaceAll(
    "'",
    "'\\''",
  );
  return ` --strict-mcp-config --mcp-config '${config}'`;
};

// @claim infra/orchestra
const cmdSpawn = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const [taskId, agent] = positionals;
  if (!agent) throw new OrchestraError(USAGE);
  const task = findTask(taskId);
  if (!briefHasContent(readTask(task).body)) {
    throw new OrchestraError(
      `write the brief in ${task.brief} before spawning`,
    );
  }
  if (paneOf(task.id))
    throw new OrchestraError(
      `task ${task.id} already has a live window w:${task.id}`,
    );
  const cwd = realPath((values.cwd as string | undefined) ?? root());
  if (!isDirectory(cwd)) throw new OrchestraError(`cwd does not exist: ${cwd}`);
  const servers = ((values.mcp as string | undefined) ?? "")
    .split(",")
    .map(function (name) {
      return name.trim();
    })
    .filter(function (name) {
      return name.length > 0;
    });
  if (values.cmd !== undefined && servers.length > 0) {
    throw new OrchestraError("give either --cmd or --mcp");
  }
  const command =
    (values.cmd as string | undefined) ??
    `${AGENTS[agent]?.command ?? agent}${mcpArguments(agent, servers)}`;
  const asArgument = values.arg === true;
  const pane = openWorkerWindow(task, cwd);
  updateTask(task, {
    status: "running",
    agent,
    command,
    cwd,
    session: paneSession(pane),
    started: now(),
    finished: "",
    reported: "",
  });
  const promptFlag = promptFlagOf(agent, command, asArgument);
  saveRuntime(task, {
    baseline: takeBaseline(cwd),
    test_titles: testTitles(root()),
    prompt_flag: promptFlag,
  });
  launchAgent(task, pane, command, workerPrompt(task), promptFlag);
  for (const item of taskList(task, "items"))
    journalSet(task.feature, item, "in_progress");
  console.log(
    `spawned ${task.id} (${command}) in window w:${task.id} (${pane})`,
  );
};

const cmdSend = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const task = findTask(positionals[0]);
  const message = positionals.slice(1);
  const file = values.file as string | undefined;
  if (message.length > 0 === Boolean(file)) {
    throw new OrchestraError("give either a message or --file PATH");
  }
  const text = file ? readFileSync(file, "utf-8") : message.join(" ");
  if (!text.trim()) throw new OrchestraError("nothing to send");
  deliver(requirePane(task), text, `w:${task.id}`);
  if (STOP_STATUSES.includes(taskStatus(task))) {
    updateTask(task, { status: "running", finished: "", reported: "" });
  }
  console.log(`sent to w:${task.id}`);
};

// @claim infra/orchestra
const cmdGo = function (parsed: Parsed) {
  const { positionals } = parsed;
  const task = findTask(positionals[0]);
  if (taskStatus(task) !== "plan-ready") {
    throw new OrchestraError(
      `task ${task.id} is ${taskStatus(task)}, not plan-ready`,
    );
  }
  const pane = requirePane(task);
  const message =
    positionals.slice(1).join(" ").trim() || "Approved as planned.";
  updateTask(
    task,
    { status: "running", finished: "", reported: "" },
    `\n## Go — ${now()}\n\n${message}\n`,
  );
  deliver(
    pane,
    `GO: your plan is approved. Read the latest ## Go section of your brief (${task.brief}) and implement it.`,
    `w:${task.id}`,
  );
  console.log(`${task.id}: plan approved; running`);
};

// @claim infra/orchestra
const cmdRestart = function (parsed: Parsed) {
  const task = findTask(parsed.positionals[0]);
  const pane = paneOf(task.id);
  if (pane) tmux(["kill-window", "-t", pane]);
  respawnWorker(task);
  console.log(
    `${task.id}: relaunched with a fresh context; resuming from its log`,
  );
};

// @claim infra/orchestra
const cmdResume = function (parsed: Parsed) {
  const { positionals } = parsed;
  const task = findTask(positionals[0]);
  if (taskStatus(task) === "closed") {
    throw new OrchestraError(
      `task ${task.id} is closed; spawn it again to reopen it`,
    );
  }
  const message = positionals.slice(1).join(" ").trim();
  if (message) updateTask(task, {}, `\n## Resume — ${now()}\n\n${message}\n`);
  const pane = paneOf(task.id);
  if (!pane) {
    respawnWorker(task);
    console.log(
      `${task.id}: relaunched in w:${task.id} with the resume prompt`,
    );
    return;
  }
  deliver(
    pane,
    message
      ? `RESUME: read the latest ## Resume section of your brief (${task.brief}) and continue.`
      : resumePrompt(task),
    `w:${task.id}`,
  );
  updateTask(task, { status: "running", finished: "", reported: "" });
  console.log(`${task.id}: resumed in its live window`);
};

const cmdPeek = function (parsed: Parsed) {
  const { positionals } = parsed;
  const pane = requirePane(findTask(positionals[0]));
  const lines = numberOption(positionals[1], 40);
  console.log(capture(pane, lines).split("\n").slice(-lines).join("\n"));
};

// @claim infra/orchestra
const cmdClose = function (parsed: Parsed) {
  const task = findTask(parsed.positionals[0]);
  const pane = paneOf(task.id);
  if (pane) tmux(["kill-window", "-t", pane]);
  const closing = CLOSABLE_STATUSES.includes(taskStatus(task));
  if (closing)
    updateTask(task, { status: "closed", reported: "closed", finished: now() });
  console.log(
    `${pane ? `closed w:${task.id}` : `${task.id} has no live window`}${closing ? "; task marked closed (reconcile never respawns it)" : ""}`,
  );
};

const cmdStatus = function () {
  const panes = workerPanes();
  const tasks = allTasks();
  const rows = [["TASK", "STATUS", "ROLE", "LIVE", "CTX", "AGENT", "FEATURE"]];
  const problems: string[] = [];
  for (const task of tasks) {
    const problem = taskProblem(task);
    if (problem !== null) {
      problems.push(`broken: ${problem}`);
      rows.push([
        task.id,
        "broken",
        "-",
        panes[task.id] ? "yes" : "no",
        "-",
        "-",
        task.feature,
      ]);
      continue;
    }
    const { fields } = readTask(task);
    const pane = panes[task.id];
    rows.push([
      task.id,
      String(fields.status || "draft"),
      String(fields.role || "-"),
      pane ? "yes" : "no",
      contextLabel(pane),
      String(fields.agent || "-"),
      task.feature,
    ]);
  }
  const recorded = new Set(
    tasks.map(function (task) {
      return task.id;
    }),
  );
  for (const [orphan, pane] of Object.entries(panes).sort()) {
    if (!recorded.has(orphan)) {
      rows.push([
        orphan,
        "orphan",
        "-",
        "yes",
        contextLabel(pane),
        "-",
        "(window has no task record)",
      ]);
    }
  }
  printTable(rows);
  for (const problem of problems) console.log(problem);
};

const cmdReconcile = function (parsed: Parsed) {
  const { values } = parsed;
  const changes = reconcile(values.respawn === true);
  for (const change of changes.length > 0
    ? changes
    : ["records and windows agree"]) {
    console.log(change);
  }
};

const brokenFile = function (): string {
  const uid = process.getuid ? process.getuid() : 0;
  return join(
    tmpdir(),
    `orchestra-${uid}`,
    sha1(currentSession()).slice(0, 10),
    "broken.json",
  );
};

const readBrokenFile = function (): Record<string, string> {
  try {
    return JSON.parse(readFileSync(brokenFile(), "utf-8")) as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
};

// @claim infra/orchestra-watch
const brokenEvents = function (tasks: Task[], wanted: Set<string>): Event[] {
  const known = readBrokenFile();
  const current: Record<string, string> = {};
  const events: Event[] = [];
  for (const task of tasks) {
    if (wanted.size > 0 && !wanted.has(task.id)) continue;
    const problem = taskProblem(task);
    if (problem === null) continue;
    current[task.folder] = problem;
    if (known[task.folder] !== problem)
      events.push([
        task.id,
        "broken",
        `${problem}; other tasks are still watched`,
      ]);
  }
  if (JSON.stringify(current) !== JSON.stringify(known)) {
    mkdirSync(dirname(brokenFile()), { recursive: true, mode: 0o700 });
    writeAtomically(brokenFile(), JSON.stringify(current, null, 1));
  }
  return events;
};

// @claim infra/orchestra-watch
const cmdWatch = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const wanted = new Set(positionals);
  const interval = numberOption(values.interval, 10);
  const idlePolls = Math.max(1, numberOption(values.idle, 3));
  const cap = numberOption(values.cap, 60);
  const timeout = numberOption(values.timeout, 0);
  const pattern = values.match as string | undefined;
  const match = pattern ? new RegExp(pattern, "i") : null;
  const deadline = timeout > 0 ? monotonic() + timeout : null;
  const reportedHere = new Set<string>();
  for (;;) {
    reconcile(false);
    const session = currentSession();
    const all = allTasks();
    const events: Event[] = brokenEvents(all, wanted);
    const everything = readableTasks(all);
    const watched = everything.filter(function (task) {
      return (
        taskGet(task, "session") === session &&
        (wanted.size === 0 || wanted.has(task.id))
      );
    });
    const panes = workerPanes();
    const snapshots = new Map<string, Snapshot>();
    for (const task of watched) {
      try {
        events.push(...recordEvents(task));
        const pane = panes[task.id];
        if (pane && taskStatus(task) === "running") {
          events.push(...screenEvents(task, pane, cap, idlePolls, match));
          events.push(...repoEvents(task, everything, snapshots));
        }
      } catch (error) {
        if (!(error instanceof OrchestraError)) throw error;
        const key = `${task.id}\n${error.message}`;
        if (reportedHere.has(key)) continue;
        reportedHere.add(key);
        events.push([task.id, "broken", error.message]);
      }
    }
    for (const [taskId, kind, detail] of events)
      console.log(`orchestra: ${taskId} ${kind}: ${detail}`);
    if (events.length > 0 && values.follow !== true) return;
    if (
      !watched.some(function (task) {
        return taskStatus(task) === "running";
      })
    ) {
      console.log("orchestra: no running tasks");
      return;
    }
    let pause = interval;
    if (deadline !== null) {
      const remaining = deadline - monotonic();
      if (remaining <= 0) process.exit(2);
      pause = Math.min(pause, remaining);
    }
    sleep(pause);
  }
};

// @claim infra/orchestra
const cmdDiff = function (parsed: Parsed) {
  const task = findTask(parsed.positionals[0]);
  const baseline = loadRuntime(task).baseline;
  if (!baseline?.top)
    throw new OrchestraError(
      `no spawn baseline for ${task.id}; respawn with a fresh snapshot before diff or accept`,
    );
  const current = repoSnapshot(baseline.top);
  for (const path of changedSince(baseline, current)) {
    const before =
      baseline.dirty[path] === "deleted"
        ? false
        : baseline.dirty[path] !== undefined
          ? true
          : Boolean(
              baseline.head &&
              run(
                "git",
                [
                  "-C",
                  baseline.top,
                  "rev-parse",
                  "-q",
                  "--verify",
                  `${baseline.head}:${path}`,
                ],
                { check: false },
              ).trim(),
            );
    const after = lexists(join(baseline.top, path));
    const kind =
      !before && after ? "added" : before && !after ? "removed" : "changed";
    console.log(`${kind.padEnd(7)} ${path}`);
  }
};

// @claim infra/orchestra
const reportRef = function (task: Task): string {
  return `journal/features/${task.feature}/tasks/${task.id}/report.md`;
};

// @claim infra/orchestra
const itemReports = function (task: Task): { item: string; refs: string[] }[] {
  const report = reportRef(task);
  return taskList(task, "items").map(function (item) {
    return { item, refs: [report] };
  });
};

// @claim infra/orchestra
const cmdAccept = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const task = findTask(positionals[0]);
  if (taskStatus(task) !== "done") {
    throw new OrchestraError(
      `task ${task.id} is ${taskStatus(task)}; only done tasks can be accepted`,
    );
  }
  const runtime = loadRuntime(task);
  const baseline = runtime.baseline;
  const top = baseline?.top ?? "";
  const titles = runtime.test_titles;
  const withoutTitleGuard = values["without-title-guard"] === true;
  if (titles === undefined && !withoutTitleGuard) {
    throw new OrchestraError(
      `no test-title snapshot for ${task.id}; pass --without-title-guard to accept this legacy task explicitly`,
    );
  }
  if (titles !== undefined && withoutTitleGuard) {
    throw new OrchestraError(
      `--without-title-guard is only for a task without a test-title snapshot`,
    );
  }
  if (!top && !withoutTitleGuard)
    throw new OrchestraError(
      `no spawn baseline for ${task.id}; respawn with a fresh snapshot before diff or accept`,
    );
  if (titles !== undefined) {
    const currentTitles = new Set(testTitles(root()));
    const missing = titles.filter(function (title) {
      return !currentTitles.has(title);
    });
    const removed = (values["removed-title"] as string[] | undefined) ?? [];
    const invalid = removed.filter(function (title) {
      return !missing.includes(title);
    });
    if (invalid.length > 0)
      throw new OrchestraError(
        `not missing test titles: ${invalid.join(", ")}`,
      );
    const unaccepted = missing.filter(function (title) {
      return !removed.includes(title);
    });
    if (unaccepted.length > 0)
      throw new OrchestraError(
        `test titles removed since spawn: ${unaccepted.join("; ")}; pass --removed-title '<title>' only if intentional`,
      );
  }
  const changed = top ? changedSince(baseline, repoSnapshot(top)) : [];
  const grant = taskList(task, "grant");
  const granted = changed.filter(function (path) {
    return matchesAny(path, grant);
  });
  if (withoutTitleGuard)
    updateTask(
      task,
      {},
      `\n## Test-title guard skipped — ${now()}\n\nAccepted with --without-title-guard because this task has no spawn title snapshot.\n`,
    );
  for (const { item, refs } of itemReports(task)) {
    journalSet(task.feature, item, "implemented", refs, "report");
  }
  updateTask(task, { status: "accepted", reported: "accepted" });
  const pane = paneOf(task.id);
  if (values.close === true && pane) tmux(["kill-window", "-t", pane]);
  const work = changed.filter(function (path) {
    return !matchesAny(path, JOURNAL_FILES_THE_ORCHESTRATOR_WRITES);
  });
  console.log(
    !top
      ? `accepted ${task.id}; files changed since spawn unknown (no baseline)`
      : work.length > 0
        ? `accepted ${task.id}; files changed since spawn:`
        : `accepted ${task.id}; no files changed since spawn`,
  );
  for (const path of work) {
    console.log(
      `  ${path}${granted.includes(path) ? "" : "  (outside grant)"}`,
    );
  }
};

// @claim infra/orchestra
const cmdDone = function (parsed: Parsed) {
  const { positionals } = parsed;
  const task = findTask(positionals[0]);
  const status = positionals[1] ?? "done";
  if (!(status in WORKER_FILE_FOR_STATUS)) {
    throw new OrchestraError(
      `status must be ${Object.keys(WORKER_FILE_FOR_STATUS).join("|")}`,
    );
  }
  const required = taskFile(
    task,
    WORKER_FILE_FOR_STATUS[status] ?? "report.md",
  );
  if (!existsSync(required)) {
    throw new OrchestraError(
      `write ${required} before \`pnpm orchestra done ${task.id} ${status}\``,
    );
  }
  const changes: Fields = { status, reported: "", finished: now() };
  updateTask(task, changes);
  console.log(`${task.id}: ${status}`);
};

// @claim infra/handoff
const cmdHandoff = function (parsed: Parsed) {
  const { positionals, values } = parsed;
  const delay = numberOption(values.delay, 20);
  const pane = process.env.TMUX_PANE ?? "";
  const orchestrator = sessionOption("@orchestra_pane");
  if (!pane || pane !== orchestrator) {
    throw new OrchestraError(
      `handoff must run in the orchestrator pane (${orchestrator || "none; run pnpm orchestra init"})`,
    );
  }
  const feature = sessionOption("@orchestra_feature");
  if (!feature) {
    throw new OrchestraError(
      "no feature for this session; run `pnpm orchestra init <feature>` first",
    );
  }
  const file = values.file as string | undefined;
  if (positionals.length > 0 && file)
    throw new OrchestraError("give either a prompt or --file PATH");
  const supplied = file ? readFileSync(file, "utf-8") : positionals.join(" ");
  if ((file || positionals.length > 0) && !supplied.trim())
    throw new OrchestraError("nothing to hand off");
  let promptFile = "";
  if (file || positionals.length > 0) {
    promptFile = join(
      dirname(brokenFile()),
      `handoff-${process.pid}-${Date.now()}.prompt.md`,
    );
    mkdirSync(dirname(promptFile), { recursive: true, mode: 0o700 });
    writeFileSync(promptFile, supplied, { mode: 0o600 });
  }
  const guard = [
    `TMUX=${shellQuote(process.env.TMUX ?? "")}`,
    `ORCHESTRA_ROOT=${shellQuote(root())}`,
    shellQuote(process.execPath),
    "run",
    "-A",
    shellQuote(SCRIPT),
    "_guard",
    shellQuote(pane),
    shellQuote(feature),
    shellQuote(String(delay)),
    shellQuote(promptFile),
    ">/dev/null 2>&1",
  ].join(" ");
  tmux(["run-shell", "-b", guard]);
  console.log(
    promptFile
      ? `handoff armed: pane ${pane} will be cleared once this turn ends, then resumes from the supplied prompt`
      : `handoff armed: pane ${pane} will be cleared once this turn ends, then resumes orchestrating ${feature}`,
  );
};

// @claim infra/handoff
const handoffOpening = function (feature: string): string {
  return `Resume orchestrating ${feature}. Read the rendered handoff injected by the session hook; if it is missing, run pnpm journal handoff ${feature}. Read the briefs of active tasks named there. Carry on orchestrating from the handoff: run pnpm orchestra status and re-arm pnpm orchestra watch.`;
};

// @claim infra/handoff
const handoffMessage = function (feature: string, supplied: string): string {
  const opening = handoffOpening(feature);
  return supplied ? `${opening}\n\n${supplied}` : opening;
};

// @claim infra/handoff
const cmdGuard = function (parsed: Parsed) {
  const [pane, feature, delay, promptFile] = parsed.positionals;
  if (!pane || !feature) return;
  let supplied = "";
  if (promptFile) {
    try {
      supplied = readFileSync(promptFile, "utf-8");
      if (!supplied.trim()) throw new Error("empty prompt");
    } catch {
      const message = `orchestra: handoff prompt unavailable at ${promptFile}; pane left unchanged`;
      tmux(["display-message", "-t", pane, message]);
      warn(message);
      return;
    }
  }
  sleep(numberOption(delay, 20));
  const settled = waitForSteadyScreen(pane, {
    equalPolls: 3,
    interval: 5,
    timeout: HANDOFF_SETTLE_TIMEOUT_SECONDS,
    needsCalm: true,
  });
  if (!settled) return;
  const label = "the orchestrator pane";
  deliver(pane, "/clear", label);
  waitUntilReady(pane, label, "type the resume prompt");
  deliver(pane, handoffMessage(feature, supplied), label, Boolean(supplied));
  if (promptFile) unlinkSync(promptFile);
};

// @claim infra/workspace-tools
const SUBCOMMANDS: Record<
  string,
  { schema: CliSchema; run: (parsed: Parsed) => void }
> = {
  init: {
    schema: {
      description:
        "init [feature]: register this pane as the session's orchestrator and, optionally, the feature it orchestrates.",
      options: {},
    },
    run: cmdInit,
  },
  new: {
    schema: {
      description:
        "new <feature> <task>: create a draft task folder with brief.md.",
      options: {
        role: {
          type: "string",
          description: "implementer | reviewer | probe (default implementer)",
        },
        gate: {
          type: "string",
          description:
            "none | plan: the worker stops at plan-ready until go (default none)",
        },
        items: {
          type: "string",
          description: "plan item ids, e.g. P01-I01,P01-I02",
        },
        grant: {
          type: "string",
          description:
            "path globs the worker may change, e.g. 'packages/engine/**,tooling/*.ts'",
        },
      },
    },
    run: cmdNew,
  },
  path: {
    schema: { description: "path <task>: print a task's folder.", options: {} },
    run: cmdPath,
  },
  spawn: {
    schema: {
      description:
        "spawn <task> <agent>: open window w:<task>, start the agent and deliver the worker prompt.",
      options: {
        cwd: {
          type: "string",
          description: "working directory (default: the repo root)",
        },
        cmd: {
          type: "string",
          description:
            "exact launch command, e.g. 'claude --model claude-opus-5'",
        },
        arg: {
          type: "boolean",
          description:
            "pass the prompt as a CLI argument instead of pasting it",
        },
        mcp: {
          type: "string",
          description:
            "MCP servers the worker starts with, by name from .agents/mcp_config.json, comma separated; none by default",
        },
      },
    },
    run: cmdSpawn,
  },
  send: {
    schema: {
      description:
        "send <task> <message..>: deliver a message to a worker; a stopped worker is set running.",
      options: {
        file: {
          type: "string",
          description: "deliver this file's content instead of a message",
        },
      },
    },
    run: cmdSend,
  },
  go: {
    schema: {
      description:
        "go <task> [notes..]: approve a plan-ready worker's plan; notes go under ## Go in the brief.",
      options: {},
    },
    run: cmdGo,
  },
  restart: {
    schema: {
      description:
        "restart <task>: relaunch a worker with a fresh context and resume it from its log.",
      options: {},
    },
    run: cmdRestart,
  },
  resume: {
    schema: {
      description:
        "resume <task> [message..]: continue a stopped worker, in its live window or relaunched if the window is gone; the message goes under ## Resume in the brief.",
      options: {},
    },
    run: cmdResume,
  },
  peek: {
    schema: {
      description: "peek <task> [lines]: print the tail of a worker's screen.",
      options: {},
    },
    run: cmdPeek,
  },
  close: {
    schema: {
      description:
        "close <task>: kill a worker's window; a task still in progress is marked closed so reconcile never respawns it.",
      options: {},
    },
    run: cmdClose,
  },
  status: {
    schema: {
      description: "status: tasks, their windows and context use.",
      options: {},
    },
    run: cmdStatus,
  },
  reconcile: {
    schema: {
      description:
        "reconcile: align this session's task records with its windows.",
      options: {
        respawn: {
          type: "boolean",
          description: "relaunch running or lost workers without a window",
        },
      },
    },
    run: cmdReconcile,
  },
  watch: {
    schema: {
      description:
        "watch [tasks..]: print unreported events as 'orchestra: <task> <kind>: <detail>'; exit after the first poll with events.",
      options: {
        follow: {
          type: "boolean",
          description: "keep printing events until no task runs",
        },
        interval: {
          type: "string",
          description: "seconds between polls (default 10)",
        },
        idle: {
          type: "string",
          description: "polls with an unchanged screen before idle (default 3)",
        },
        cap: {
          type: "string",
          description:
            "context use in percent that raises context (default 60)",
        },
        match: {
          type: "string",
          description:
            "regular expression; a worker screen line that matches raises match once, e.g. 'git (commit|push)|rm -rf'",
        },
        timeout: {
          type: "string",
          description: "seconds; exit 2 when reached (default 0, none)",
        },
      },
    },
    run: cmdWatch,
  },
  diff: {
    schema: {
      description:
        "diff <task>: list added, changed and removed paths since spawn.",
      options: {},
    },
    run: cmdDiff,
  },
  accept: {
    schema: {
      description:
        "accept <task>: accept a done task and set its plan items implemented with refs.",
      options: {
        close: { type: "boolean", description: "also kill the window" },
        "removed-title": {
          type: "string",
          multiple: true,
          description:
            "accept a missing test title as removed on purpose; repeat for each title",
        },
        "without-title-guard": {
          type: "boolean",
          description:
            "accept a legacy task that has no spawn test-title snapshot and record the exception in its brief",
        },
      },
    },
    run: cmdAccept,
  },
  done: {
    schema: {
      description:
        "done <task> [done|blocked|failed|plan-ready|restart]: worker sets its status after writing its file.",
      options: {},
    },
    run: cmdDone,
  },
  handoff: {
    schema: {
      description:
        "handoff [prompt..] | --file PATH: clear this pane after the turn, read the handoff and active briefs, then resume from the supplied prompt.",
      options: {
        file: {
          type: "string",
          description:
            "copy the next prompt from this file before arming the handoff",
        },
        delay: {
          type: "string",
          description: "seconds before watching the pane settle (default 20)",
        },
      },
    },
    run: cmdHandoff,
  },
  _guard: { schema: { description: "internal", options: {} }, run: cmdGuard },
};

if (import.meta.main) {
  const [command, ...rest] = process.argv.slice(2);
  const subcommand = command ? SUBCOMMANDS[command] : undefined;
  if (!subcommand) {
    console.log(USAGE);
    process.exit(!command || command === "-h" || command === "--help" ? 0 : 1);
  }
  const parsed = Cli.parseCli<Parsed["values"]>(
    `orchestra ${command}`,
    subcommand.schema,
    rest,
  );
  if (parsed === null)
    process.exit(rest.includes("--help") || rest.includes("-h") ? 0 : 1);
  try {
    subcommand.run(parsed);
  } catch (error) {
    if (!(error instanceof OrchestraError)) throw error;
    console.error(`orchestra: ${error.message}`);
    process.exit(1);
  }
}

export {
  changedSince,
  commandWithPrompt,
  deliver,
  handoffMessage,
  handoffOpening,
  itemReports,
  reportRef,
  testTitles,
};
