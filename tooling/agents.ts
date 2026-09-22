#!/usr/bin/env -S deno run -A
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Cli from "@kuib-ai/cli";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOOK = ".agents/hooks/journal-context";
const MCP_SOURCE = ".agents/mcp_config.json";
const LOCK = ".agents/generated.lock.json";

type Json = Record<string, unknown>;
type Servers = Record<string, Json>;
type Lock = Record<string, string>;
type McpTool = "claude" | "cursor" | "gemini";
type Output =
  | { kind: "file"; path: string; content: string }
  | { kind: "symlink"; path: string; target: string }
  | { kind: "absent"; path: string; reason: string };
type GeneratedOutput = Exclude<Output, { kind: "absent" }>;
type OnDisk =
  | { kind: "missing" }
  | { kind: "file"; content: string }
  | { kind: "symlink"; target: string }
  | { kind: "directory" };
type ServerSet = { path: string; servers: Servers };
type McpImport =
  | { kind: "unchanged" }
  | { kind: "imported"; from: string[]; servers: Servers }
  | { kind: "conflict"; versions: ServerSet[] };

const MCP_ADAPTERS: { tool: McpTool; path: string }[] = [
  { tool: "claude", path: ".mcp.json" },
  { tool: "cursor", path: ".cursor/mcp.json" },
  { tool: "gemini", path: ".gemini/settings.json" },
];

const REMOTE_URL_KEY: Record<McpTool, string> = {
  claude: "url",
  cursor: "url",
  gemini: "httpUrl",
};

// @claim infra/agent-sources
const mcpServers = function (tool: McpTool, servers: Servers): Servers {
  const translated: Servers = {};
  for (const [name, server] of Object.entries(servers)) {
    const { serverUrl, ...rest } = server;
    if (typeof serverUrl !== "string") {
      translated[name] = rest;
      continue;
    }
    translated[name] =
      tool === "claude"
        ? { type: "http", url: serverUrl, ...rest }
        : { [REMOTE_URL_KEY[tool]]: serverUrl, ...rest };
  }
  return translated;
};

const toSourceFormat = function (tool: McpTool, servers: Servers): Servers {
  const translated: Servers = {};
  for (const [name, server] of Object.entries(servers)) {
    const { [REMOTE_URL_KEY[tool]]: remoteUrl, ...rest } = server;
    if (typeof remoteUrl !== "string") {
      translated[name] = server;
      continue;
    }
    if (tool === "claude" && rest.type === "http") delete rest.type;
    translated[name] = { serverUrl: remoteUrl, ...rest };
  }
  return translated;
};

const read = function (path: string): string {
  return readFileSync(join(ROOT, path), "utf-8");
};

const json = function (value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
};

const sha256 = function (text: string): string {
  return createHash("sha256").update(text).digest("hex");
};

const fail = function (message: string): never {
  console.error(`  [ERROR] ${message}`);
  process.exit(1);
};

const isRecord = function (value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseRecord = function (text: string): Json | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const withSortedKeys = function (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withSortedKeys);
  if (!isRecord(value)) return value;
  const record: Json = value;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map(function (key): [string, unknown] {
        return [key, withSortedKeys(record[key])];
      }),
  );
};

const sameJson = function (left: unknown, right: unknown): boolean {
  return (
    JSON.stringify(withSortedKeys(left)) ===
    JSON.stringify(withSortedKeys(right))
  );
};

const serversIn = function (config: Json): Servers | null {
  const servers = config.mcpServers ?? {};
  if (!isRecord(servers) || !Object.values(servers).every(isRecord)) {
    return null;
  }
  return servers as Servers;
};

const settingsBesidesMcpServers = function (text: string): Json | null {
  const config = parseRecord(text);
  if (config !== null) delete config.mcpServers;
  return config;
};

const readMcpSource = function (): Json {
  return (
    parseRecord(read(MCP_SOURCE)) ?? fail(`${MCP_SOURCE} must be a JSON object`)
  );
};

const sourceServersOf = function (source: Json): Servers {
  return (
    serversIn(source) ??
    fail(`${MCP_SOURCE}: mcpServers must map names to server objects`)
  );
};

const lstatIfPresent = function (full: string): Stats | null {
  try {
    return lstatSync(full);
  } catch {
    return null;
  }
};

const inspect = function (path: string): OnDisk {
  const full = join(ROOT, path);
  const stat = lstatIfPresent(full);
  if (stat === null) return { kind: "missing" };
  if (stat.isSymbolicLink()) {
    return { kind: "symlink", target: readlinkSync(full) };
  }
  if (stat.isDirectory()) return { kind: "directory" };
  return { kind: "file", content: readFileSync(full, "utf-8") };
};

// @claim infra/session-hook
const claudeSettings = function (): string {
  const current = inspect(".claude/settings.json");
  const settings =
    current.kind === "file" ? (parseRecord(current.content) ?? {}) : {};
  return json({
    ...settings,
    hooks: {
      SessionStart: [
        {
          matcher: "startup|resume|clear|compact",
          hooks: [
            {
              type: "command",
              command: `\${CLAUDE_PROJECT_DIR}/${HOOK} claude`,
              timeout: 30,
            },
          ],
        },
      ],
    },
  });
};

// @claim infra/session-hook
const geminiSettings = function (servers: Servers): string {
  return json({
    context: { fileName: ["AGENTS.md"] },
    hooks: {
      SessionStart: [
        {
          matcher: "startup|resume|clear",
          hooks: [
            {
              type: "command",
              name: "journal-context",
              command: `$GEMINI_PROJECT_DIR/${HOOK} gemini`,
              timeout: 30000,
            },
          ],
        },
      ],
    },
    mcpServers: mcpServers("gemini", servers),
  });
};

// @claim infra/session-hook
const cursorHooks = function (): string {
  return json({
    version: 1,
    hooks: {
      sessionStart: [{ command: `${HOOK} cursor`, timeout: 30 }],
      preCompact: [{ command: `${HOOK} cursor pre-compact`, timeout: 30 }],
    },
  });
};

const ANTIGRAVITY_RULE = `---
trigger: always_on
---

# kuib — agent instructions

Read \`AGENTS.md\` at the repository root at the start of every session and follow it: it is
the single instruction source for this repository (@AGENTS.md). Skills live in
\`.agents/skills/\`.

<!-- Generated by pnpm agents sync. Do not edit. -->
`;

// @claim infra/agent-sources
const outputs = function (servers: Servers): Output[] {
  return [
    { kind: "file", path: "CLAUDE.md", content: "@AGENTS.md\n" },
    { kind: "symlink", path: ".claude/skills", target: "../.agents/skills" },
    { kind: "file", path: ".claude/settings.json", content: claudeSettings() },
    {
      kind: "file",
      path: ".mcp.json",
      content: json({ mcpServers: mcpServers("claude", servers) }),
    },
    {
      kind: "file",
      path: ".cursor/mcp.json",
      content: json({ mcpServers: mcpServers("cursor", servers) }),
    },
    { kind: "file", path: ".cursor/hooks.json", content: cursorHooks() },
    {
      kind: "file",
      path: ".gemini/settings.json",
      content: geminiSettings(servers),
    },
    {
      kind: "file",
      path: ".agents/rules/agents.md",
      content: ANTIGRAVITY_RULE,
    },
    {
      kind: "absent",
      path: ".claude/rules",
      reason: "instructions come from AGENTS.md via CLAUDE.md",
    },
    { kind: "absent", path: ".claude/hooks", reason: `hooks run ${HOOK}` },
    { kind: "absent", path: ".cursor/hooks", reason: `hooks run ${HOOK}` },
    {
      kind: "absent",
      path: ".agents/rules/workflow.md",
      reason: "merged into AGENTS.md",
    },
    {
      kind: "absent",
      path: ".claude/templates",
      reason: "journal formats live in journal/SPEC.md",
    },
  ];
};

const isGenerated = function (output: Output): output is GeneratedOutput {
  return output.kind !== "absent";
};

const generatedText = function (output: GeneratedOutput): string {
  return output.kind === "file" ? output.content : output.target;
};

const asOnDisk = function (output: GeneratedOutput): OnDisk {
  return output.kind === "file"
    ? { kind: "file", content: output.content }
    : { kind: "symlink", target: output.target };
};

const diskHash = function (state: OnDisk): string | null {
  if (state.kind === "file") return sha256(state.content);
  if (state.kind === "symlink") return sha256(state.target);
  return null;
};

const matches = function (output: GeneratedOutput, state: OnDisk): boolean {
  if (output.kind === "file") {
    return state.kind === "file" && state.content === output.content;
  }
  return state.kind === "symlink" && state.target === output.target;
};

const outOfDateReason = function (output: Output): string | null {
  const state = inspect(output.path);
  if (output.kind === "absent") {
    return state.kind === "missing"
      ? null
      : `must not exist (${output.reason})`;
  }
  if (state.kind === "missing") return "missing";
  if (matches(output, state)) return null;
  if (output.kind === "symlink") {
    return state.kind === "symlink"
      ? `must point at ${output.target}`
      : `must be a symlink to ${output.target}`;
  }
  return state.kind === "file" ? "out of date" : "must be a regular file";
};

const editedOutsideSync = function (
  output: GeneratedOutput,
  lock: Lock,
): boolean {
  const state = inspect(output.path);
  return state.kind !== "missing" && diskHash(state) !== lock[output.path];
};

// @claim infra/agents-check
const handEdited = function (
  output: GeneratedOutput,
  lock: Lock,
  importedFrom: Set<string>,
): boolean {
  const state = inspect(output.path);
  if (
    state.kind === "missing" ||
    state.kind === "directory" ||
    matches(output, state)
  )
    return false;
  if (diskHash(state) === lock[output.path]) return false;
  if (
    output.kind === "file" &&
    state.kind === "file" &&
    importedFrom.has(output.path)
  ) {
    return !sameJson(
      settingsBesidesMcpServers(state.content),
      settingsBesidesMcpServers(output.content),
    );
  }
  return true;
};

const readLock = function (): Lock | null {
  const state = inspect(LOCK);
  if (state.kind !== "file") return null;
  return parseRecord(state.content) as Lock | null;
};

const writeLock = function (generated: GeneratedOutput[]) {
  const content = json(
    Object.fromEntries(
      generated.map(function (output): [string, string] {
        return [output.path, sha256(generatedText(output))];
      }),
    ),
  );
  const current = inspect(LOCK);
  if (current.kind === "file" && current.content === content) return;
  writeFileSync(join(ROOT, LOCK), content);
  console.log(`  wrote ${LOCK}`);
};

// @claim infra/agents-check
const importMcpServers = function (source: Servers, lock: Lock): McpImport {
  const edited: ServerSet[] = [];
  let sourceChangedSinceSync = false;
  for (const adapter of MCP_ADAPTERS) {
    const state = inspect(adapter.path);
    if (state.kind !== "file") continue;
    const config = parseRecord(state.content);
    const toolServers = config === null ? null : serversIn(config);
    if (toolServers === null) continue;
    const servers = toSourceFormat(adapter.tool, toolServers);
    if (sameJson(servers, source)) continue;
    if (sha256(state.content) === lock[adapter.path]) {
      sourceChangedSinceSync = true;
    } else {
      edited.push({ path: adapter.path, servers });
    }
  }
  const [first] = edited;
  if (!first) return { kind: "unchanged" };
  const agreed = edited.every(function (version) {
    return sameJson(version.servers, first.servers);
  });
  if (agreed && !sourceChangedSinceSync) {
    return {
      kind: "imported",
      from: edited.map(function (version) {
        return version.path;
      }),
      servers: first.servers,
    };
  }
  return {
    kind: "conflict",
    versions: sourceChangedSinceSync
      ? [{ path: MCP_SOURCE, servers: source }, ...edited]
      : edited,
  };
};

const prefixed = function (prefix: string, names: string[]): string[] {
  return names.map(function (name) {
    return `${prefix}${name}`;
  });
};

const serverChanges = function (before: Servers, after: Servers): string {
  const added = Object.keys(after).filter(function (name) {
    return !Object.hasOwn(before, name);
  });
  const removed = Object.keys(before).filter(function (name) {
    return !Object.hasOwn(after, name);
  });
  const changed = Object.keys(after).filter(function (name) {
    return Object.hasOwn(before, name) && !sameJson(before[name], after[name]);
  });
  return [
    ...prefixed("+", added),
    ...prefixed("-", removed),
    ...prefixed("~", changed),
  ].join(" ");
};

const describe = function (state: OnDisk): string {
  if (state.kind === "file") return state.content;
  if (state.kind === "symlink") return `symlink to ${state.target}`;
  return state.kind;
};

const lineDiff = function (before: string, after: string): string[] {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const sharedTailLength = Array.from(
    { length: oldLines.length + 1 },
    function () {
      return new Array<number>(newLines.length + 1).fill(0);
    },
  );
  const shared = function (oldAt: number, newAt: number): number {
    return sharedTailLength[oldAt]?.[newAt] ?? 0;
  };
  for (let oldAt = oldLines.length - 1; oldAt >= 0; oldAt--) {
    const row = sharedTailLength[oldAt];
    if (!row) continue;
    for (let newAt = newLines.length - 1; newAt >= 0; newAt--) {
      row[newAt] =
        oldLines[oldAt] === newLines[newAt]
          ? shared(oldAt + 1, newAt + 1) + 1
          : Math.max(shared(oldAt + 1, newAt), shared(oldAt, newAt + 1));
    }
  }
  const diff: string[] = [];
  let oldAt = 0;
  let newAt = 0;
  while (oldAt < oldLines.length || newAt < newLines.length) {
    const oldLeft = oldAt < oldLines.length;
    const newLeft = newAt < newLines.length;
    if (oldLeft && newLeft && oldLines[oldAt] === newLines[newAt]) {
      oldAt++;
      newAt++;
    } else if (
      oldLeft &&
      (!newLeft || shared(oldAt + 1, newAt) >= shared(oldAt, newAt + 1))
    ) {
      diff.push(`-${oldLines[oldAt++]}`);
    } else {
      diff.push(`+${newLines[newAt++]}`);
    }
  }
  return diff;
};

const printIndented = function (text: string) {
  for (const line of text.split("\n")) console.log(`    ${line}`);
};

const printConflict = function (versions: ServerSet[]) {
  console.log("  MCP servers were edited differently since the last sync:");
  for (const version of versions) {
    console.log(`\n  ${version.path}:`);
    printIndented(JSON.stringify(version.servers, null, 2));
  }
  console.log(
    `\n  nothing written: make them agree, or set the servers in ${MCP_SOURCE} and run \`pnpm agents sync --force\``,
  );
};

const printHandEdits = function (edits: GeneratedOutput[]) {
  for (const output of edits) {
    console.log(`  ${output.path} was edited by hand`);
    const diff = lineDiff(
      describe(inspect(output.path)),
      describe(asOnDisk(output)),
    );
    printIndented(diff.join("\n"));
    console.log("");
  }
  console.log(
    "  nothing written: move the edits into AGENTS.md or .agents/, or run `pnpm agents sync --force` to overwrite them",
  );
};

// @claim infra/agents-check
const skillProblems = function (): string[] {
  const problems: string[] = [];
  const dir = join(ROOT, ".agents/skills");
  for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name, "SKILL.md");
    if (!existsSync(file)) {
      problems.push(`.agents/skills/${name}: missing SKILL.md`);
      continue;
    }
    const front =
      readFileSync(file, "utf-8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    if (front.match(/^name:\s*(.+)$/m)?.[1]?.trim() !== name) {
      problems.push(
        `.agents/skills/${name}/SKILL.md: name must equal the folder name`,
      );
    }
    if (!/^description:\s*\S/m.test(front)) {
      problems.push(`.agents/skills/${name}/SKILL.md: missing description`);
    }
  }
  return problems;
};

const write = function (output: Output) {
  const full = join(ROOT, output.path);
  if (output.kind === "absent") {
    rmSync(full, { recursive: true, force: true });
    return;
  }
  mkdirSync(dirname(full), { recursive: true });
  const current = inspect(output.path);
  const overwritesInPlace = output.kind === "file" && current.kind === "file";
  if (current.kind !== "missing" && !overwritesInPlace) {
    rmSync(full, { recursive: true, force: true });
  }
  if (output.kind === "symlink") symlinkSync(output.target, full);
  else writeFileSync(full, output.content);
};

// @claim infra/agents-check
const sync = function (force: boolean) {
  const lock = readLock() ?? {};
  const source = readMcpSource();
  const sourceServers = sourceServersOf(source);
  const mcpImport: McpImport = force
    ? { kind: "unchanged" }
    : importMcpServers(sourceServers, lock);
  if (mcpImport.kind === "conflict") {
    printConflict(mcpImport.versions);
    process.exit(1);
  }
  const servers =
    mcpImport.kind === "imported" ? mcpImport.servers : sourceServers;
  const importedFrom = new Set(
    mcpImport.kind === "imported" ? mcpImport.from : [],
  );
  const planned = outputs(servers);
  const generated = planned.filter(isGenerated);
  const handEdits = generated.filter(function (output) {
    return handEdited(output, lock, importedFrom);
  });
  if (handEdits.length > 0 && !force) {
    printHandEdits(handEdits);
    process.exit(1);
  }
  if (mcpImport.kind === "imported") {
    writeFileSync(
      join(ROOT, MCP_SOURCE),
      json({ ...source, mcpServers: servers }),
    );
    console.log(
      `  imported MCP servers from ${mcpImport.from.join(", ")}: ${serverChanges(sourceServers, servers)}`,
    );
  }
  for (const output of planned) {
    if (outOfDateReason(output) === null) continue;
    write(output);
    console.log(
      `  ${output.kind === "absent" ? "removed" : "wrote"} ${output.path}`,
    );
  }
  writeLock(generated);
  for (const issue of skillProblems()) console.log(`  [ERROR] ${issue}`);
};

// @claim infra/agents-check
const check = function () {
  const lock = readLock();
  const planned = outputs(sourceServersOf(readMcpSource()));
  const issues: string[] = [];
  if (lock === null) {
    issues.push(`${LOCK}: missing or unreadable; run \`pnpm agents sync\``);
  }
  for (const output of planned) {
    if (
      lock !== null &&
      isGenerated(output) &&
      editedOutsideSync(output, lock)
    ) {
      issues.push(
        `${output.path}: edited outside sync; run \`pnpm agents sync\` to import or \`--force\` to overwrite`,
      );
      continue;
    }
    const reason = outOfDateReason(output);
    if (reason !== null) issues.push(`${output.path}: ${reason}`);
  }
  issues.push(...skillProblems());
  for (const issue of issues) console.log(`  [ERROR] ${issue}`);
  if (issues.length > 0) {
    console.log(`\n  ${issues.length} errors — run \`pnpm agents sync\``);
    process.exit(1);
  }
  console.log("  agent adapters in sync (.agents/ → tools)");
};

const USAGE =
  "usage: pnpm agents <command>\n  sync [--force]   write every adapter; import MCP edits; refuse other hand edits\n  check            fail when an adapter is missing, stale or edited outside sync";

// @claim infra/workspace-tools
const SUBCOMMANDS: Record<
  string,
  { schema: CliSchema; run: (force: boolean) => void }
> = {
  sync: {
    schema: {
      description:
        "sync: write every tool adapter from AGENTS.md and .agents/, importing MCP servers a tool added and refusing to overwrite other hand edits.",
      options: {
        force: {
          type: "boolean",
          description: "overwrite hand edits and skip the MCP import",
        },
      },
    },
    run: sync,
  },
  check: {
    schema: {
      description:
        "check: fail when an adapter is missing, stale, edited outside sync, or a retired path reappears.",
      options: {},
    },
    run: function () {
      check();
    },
  },
};

const [command, ...rest] = process.argv.slice(2);
const subcommand = command ? SUBCOMMANDS[command] : undefined;
if (!subcommand) {
  console.log(USAGE);
  process.exit(!command || command === "-h" || command === "--help" ? 0 : 1);
}
const parsed = Cli.parseCli<{ force?: boolean }>(
  `agents ${command}`,
  subcommand.schema,
  rest,
);
if (parsed === null)
  process.exit(rest.includes("--help") || rest.includes("-h") ? 0 : 1);
subcommand.run(parsed.values.force === true);
