#!/usr/bin/env -S deno run -A
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "@std/toml";
import { parse as parseYaml } from "@std/yaml";
import ts from "typescript";
import Cli from "@kuib-ai/cli";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JOURNAL = join(ROOT, "journal");
const DOMAINS = ["product", "core", "host", "infra"] as const;
const AGENTS_PATH = join(ROOT, "AGENTS.md");
const GENERATED_START = "<!-- journal:generated:start -->";
const GENERATED_END = "<!-- journal:generated:end -->";
const STALE_ITEM_DAYS = 60;
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const USAGE = `usage: pnpm journal <command>
  check                                   validate the journal and the code links
  build                                   regenerate _index.md, roadmap/ROADMAP.md, the AGENTS.md block
  drift [--files]                         claims whose evidence changed since they were stamped
  gate                                    fail unless every claim is fresh (before a commit)
  stamp <domain>[/<claim>] | --all        regenerate claim sources from @claim links, rehash, date
  claims <path>...                        the claims tied to a file
  set <feature> <item> <state> [--ref <path>[=<role>]]...
  checkpoint <feature> [--summary S] [--next A,B] [--blockers "A|B"] [--note N] [--clear-note]
  handoff <feature>                       the rendered handoff for a feature
  brief [--hook claude|gemini|cursor] [--failing]`;

type Level = "error" | "warning";
interface Issue {
  level: Level;
  where: string;
  message: string;
}
const issues: Issue[] = [];
const report = function (level: Level, where: string, message: string) {
  issues.push({ level, where, message });
};

const fail = function (message: string): never {
  console.error(message);
  process.exit(1);
};

const read = function (path: string): string {
  return readFileSync(path, "utf-8");
};

const listFiles = function (dir: string, suffix = ".md"): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, suffix));
    else if (name.endsWith(suffix)) out.push(full);
  }
  return out;
};

const listDirs = function (dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(function (name) {
      return !name.startsWith(".") && statSync(join(dir, name)).isDirectory();
    })
    .sort();
};

const gitOk = function (...args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const tmux = function (...args: string[]): string {
  try {
    return execFileSync("tmux", args, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
};

const rel = function (path: string): string {
  return relative(ROOT, path);
};

const jrel = function (path: string): string {
  return relative(JOURNAL, path).replace(/\.md$/, "");
};

const today = function (): string {
  const now = new Date();
  const pad = function (n: number) {
    return String(n).padStart(2, "0");
  };
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const hash8 = function (text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 8);
};

const at = function (list: readonly string[], index: number): string {
  return list[index] ?? "";
};

const group = function (
  match: RegExpMatchArray | null | undefined,
  index: number,
): string {
  return match?.[index] ?? "";
};

type Values = Record<string, string | boolean | string[] | undefined>;

interface Parsed {
  positionals: string[];
  values: Values;
}

type Fm = Record<string, unknown>;
const FRONTMATTER = /^---\n([\s\S]*?)\n---(?:\n|$)/;

const parseFrontmatter = function (content: string, where?: string): Fm | null {
  const match = content.match(FRONTMATTER);
  if (!match) return null;
  try {
    const value = parseYaml(match[1] ?? "", { schema: "failsafe" });
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Fm)
      : {};
  } catch (error) {
    if (where) {
      report(
        "error",
        where,
        `invalid frontmatter: ${(error as Error).message.split("\n")[0]}`,
      );
    }
    return {};
  }
};

const str = function (fm: Fm, key: string): string {
  const value = fm[key];
  return typeof value === "string" ? value : "";
};

const list = function (fm: Fm, key: string): string[] {
  const value = fm[key];
  if (Array.isArray(value)) return value.map(String);
  return typeof value === "string" && value ? [value] : [];
};

const yamlLines = function (
  key: string,
  value: unknown,
  indent: string,
): string[] {
  if (Array.isArray(value)) {
    return [
      `${indent}${key}: [${value
        .map(function (v) {
          return JSON.stringify(String(v));
        })
        .join(", ")}]`,
    ];
  }
  if (value && typeof value === "object") {
    return [
      `${indent}${key}:`,
      ...Object.entries(value).flatMap(function ([k, v]) {
        return yamlLines(k, v, `${indent}  `);
      }),
    ];
  }
  const text = String(value ?? "");
  if (!text.includes("\n")) return [`${indent}${key}: ${JSON.stringify(text)}`];
  return [
    `${indent}${key}: |-`,
    ...text.split("\n").map(function (line) {
      return line ? `${indent}  ${line}` : "";
    }),
  ];
};

const setFrontmatterKey = function (
  content: string,
  key: string,
  value: unknown,
): string {
  const match = content.match(FRONTMATTER);
  if (!match) throw new Error("no frontmatter");
  const lines = (match[1] ?? "").split("\n");
  const start = lines.findIndex(function (line) {
    return line.startsWith(`${key}:`);
  });
  const rendered = yamlLines(key, value, "");
  if (start === -1) lines.push(...rendered);
  else {
    let end = start + 1;
    while (
      end < lines.length &&
      (at(lines, end) === "" || /^\s/.test(at(lines, end)))
    )
      end++;
    lines.splice(start, end - start, ...rendered);
  }
  return `---\n${lines.join("\n")}\n---\n${content.slice(match[0].length)}`;
};

const stripFences = function (content: string): string[] {
  let inFence = false;
  return content.split("\n").map(function (line) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    return inFence ? "" : line;
  });
};

const headings = function (content: string, levels = [1, 2, 3, 4, 5, 6]) {
  const out: string[] = [];
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  for (const line of stripFences(body)) {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m && levels.includes(group(m, 1).length)) out.push(group(m, 2));
  }
  return out;
};

const blockIds = function (content: string): Set<string> {
  const ids = new Set<string>();
  for (const line of stripFences(content)) {
    const m = line.match(/(?:^|\s)\^([A-Za-z0-9-]+)\s*$/);
    if (m) ids.add(group(m, 1));
  }
  return ids;
};

const wikilinks = function (text: string): string[] {
  return [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(
    function (m) {
      return group(m, 1);
    },
  );
};

const resolveLink = function (target: string): string | null {
  const hash = target.indexOf("#");
  const path = hash === -1 ? target : target.slice(0, hash);
  const anchor = hash === -1 ? "" : target.slice(hash + 1);
  if (path.startsWith("_archive/") && !existsSync(join(JOURNAL, "_archive"))) {
    return null;
  }
  const file = join(JOURNAL, `${path}.md`);
  if (!existsSync(file)) return `missing file journal/${path}.md`;
  if (!anchor) return null;
  const content = read(file);
  if (anchor.startsWith("^")) {
    return blockIds(content).has(anchor.slice(1))
      ? null
      : `missing block ^${anchor.slice(1)} in journal/${path}.md`;
  }
  return headings(content).includes(anchor)
    ? null
    : `missing heading "${anchor}" in journal/${path}.md`;
};

const checkLinks = function (where: string, text: string) {
  for (const link of wikilinks(text)) {
    const problem = resolveLink(link);
    if (problem) report("error", where, `broken link [[${link}]]: ${problem}`);
  }
};

const globToRegExp = function (glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i] ?? "";
    if (ch === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") {
        out += "(?:.*/)?";
        i += 2;
      } else {
        out += ".*";
        i += 1;
      }
    } else if (ch === "*") out += "[^/]*";
    else if (ch === "?") out += "[^/]";
    else if (ch === "{") out += "(?:";
    else if (ch === "}") out += ")";
    else if (ch === "," && out.lastIndexOf("(?:") > out.lastIndexOf(")"))
      out += "|";
    else out += ch.replace(/[.+^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
};

const workspaceFiles = function (): string[] {
  const out = gitOk("ls-files", "--cached", "--others", "--exclude-standard");
  return (out ?? "").split("\n").filter(function (f) {
    return f && !f.startsWith("journal/") && existsSync(join(ROOT, f));
  });
};

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".swift",
  ".sh",
  ".bash",
  ".zsh",
  ".rs",
  ".go",
  ".rb",
  ".lua",
  ".kt",
  ".java",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".m",
]);
const AST_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);
const CLAIM_LINK =
  /^\s*(?:\/\/+|#+|--|\/\*+|\*)\s*@claim\s+(.+?)\s*(?:\*\/)?\s*$/;
const LEGACY_LINK = /\/\/ @context\s+@journal\//;
const LINK_TARGET = new RegExp(`^(${DOMAINS.join("|")})(?:/(${SLUG}))?$`);
const COMMENT_LINE = /^\s*(?:\/\/|#(?!!)|--|\/\*|\*)/;

interface Link {
  path: string;
  line: number;
  targets: string[];
  file: boolean;
}

interface Scope {
  path: string;
  line: number;
  label: string;
  hash: string;
  claims: string[];
}

interface CodeIndex {
  links: Link[];
  scopes: Scope[];
  files: Set<string>;
}

const nodeName = function (node: ts.Node): string | null {
  if (ts.isVariableStatement(node)) {
    const first = node.declarationList.declarations[0];
    return first && ts.isIdentifier(first.name) ? first.name.text : null;
  }
  if (ts.isExportAssignment(node)) return "default";
  const named = node as ts.Node & { name?: ts.Node };
  if (
    named.name &&
    (ts.isIdentifier(named.name) ||
      ts.isStringLiteral(named.name) ||
      ts.isPrivateIdentifier(named.name))
  ) {
    return named.name.text;
  }
  return null;
};

const cleanLabel = function (text: string): string {
  return text.replace(/`/g, "'").replace(/\s+/g, " ").trim().slice(0, 60);
};

// @claim infra/claim-verification
const astScopes = function (
  path: string,
  content: string,
  links: Link[],
): Scope[] {
  const kind = /\.[jt]sx$/.test(path)
    ? ts.ScriptKind.TSX
    : /\.[mc]?js$/.test(path)
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const byLine = new Map(
    links.map(function (link) {
      return [link.line, link];
    }),
  );
  const found = new Map<number, Scope>();
  const printer = ts.createPrinter({ removeComments: true });
  const visit = function (node: ts.Node, names: string[]) {
    const own = nodeName(node);
    for (const range of ts.getLeadingCommentRanges(
      content,
      node.getFullStart(),
    ) ?? []) {
      const line = source.getLineAndCharacterOfPosition(range.pos).line;
      const link = byLine.get(line);
      if (!link || found.has(line)) continue;
      const text = printer
        .printNode(ts.EmitHint.Unspecified, node, source)
        .replace(/\s+/g, " ")
        .trim();
      const first = node.getText(source).split("\n")[0];
      const label = own
        ? [...names, own].join(".")
        : `${names.length > 0 ? `${names.join(".")} › ` : ""}${first}`;
      found.set(line, {
        path,
        line,
        label: cleanLabel(label),
        hash: hash8(text),
        claims: link.targets,
      });
    }
    const next =
      own && names[names.length - 1] !== own ? [...names, own] : names;
    ts.forEachChild(node, function (child) {
      visit(child, next);
    });
  };
  ts.forEachChild(source, function (child) {
    visit(child, []);
  });
  for (const link of links) {
    if (!found.has(link.line))
      report(
        "error",
        `${path}:${link.line + 1}`,
        "@claim is not followed by code",
      );
  }
  return [...found.values()];
};

const indentOf = function (line: string): number {
  return line.match(/^\s*/)![0].replace(/\t/g, "    ").length;
};

const bracketBalance = function (line: string): number {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] ?? "";
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
  }
  return depth;
};

// @claim infra/claim-verification
const blockScopes = function (
  path: string,
  lines: string[],
  links: Link[],
): Scope[] {
  const scopes: Scope[] = [];
  for (const link of links) {
    let start = link.line + 1;
    while (
      start < lines.length &&
      (at(lines, start).trim() === "" || COMMENT_LINE.test(at(lines, start)))
    )
      start++;
    let head = start;
    while (head < lines.length && at(lines, head).trim().startsWith("@"))
      head++;
    if (head >= lines.length) {
      report(
        "error",
        `${path}:${link.line + 1}`,
        "@claim is not followed by code",
      );
      continue;
    }
    const indent = indentOf(at(lines, start));
    let end = head;
    let depth = bracketBalance(at(lines, head));
    while (depth > 0 && end + 1 < lines.length) {
      end++;
      depth += bracketBalance(at(lines, end));
    }
    for (let i = end + 1; i < lines.length; i++) {
      if (at(lines, i).trim() === "") continue;
      if (indentOf(at(lines, i)) <= indent) break;
      end = i;
    }
    const body = lines
      .slice(start, end + 1)
      .filter(function (line) {
        return line.trim() !== "" && !COMMENT_LINE.test(line);
      })
      .map(function (line) {
        return line.trim().replace(/\s+/g, " ");
      })
      .join("\n");
    scopes.push({
      path,
      line: link.line,
      label: cleanLabel(at(lines, head).replace(/\s*[{:]\s*$/, "")),
      hash: hash8(body),
      claims: link.targets,
    });
  }
  return scopes;
};

let codeIndex: CodeIndex | null = null;

// @claim infra/claim-verification infra/code-links
const indexCode = function (): CodeIndex {
  if (codeIndex) return codeIndex;
  const links: Link[] = [];
  const scopes: Scope[] = [];
  const files = new Set<string>();
  for (const path of workspaceFiles()) {
    const full = join(ROOT, path);
    const ext = extname(path);
    if (ext !== "" && !CODE_EXTENSIONS.has(ext)) continue;
    if (path.endsWith(".d.ts") || !statSync(full).isFile()) continue;
    const content = read(full);
    if (ext === "" && !content.startsWith("#!")) continue;
    files.add(path);
    if (!content.includes("@claim") && !content.includes("@context")) continue;
    const lines = content.split("\n");
    const fileLine = lines[0]?.startsWith("#!") ? 1 : 0;
    const scoped: Link[] = [];
    lines.forEach(function (text, line) {
      if (LEGACY_LINK.test(text)) {
        report(
          "error",
          `${path}:${line + 1}`,
          "@context is replaced by @claim <domain>[/<claim>]",
        );
        return;
      }
      const m = text.match(CLAIM_LINK);
      if (!m) return;
      const link: Link = {
        path,
        line,
        targets: group(m, 1)
          .split(/[\s,]+/)
          .filter(Boolean),
        file: line === fileLine,
      };
      links.push(link);
      if (!link.file) scoped.push(link);
    });
    if (scoped.length === 0) continue;
    scopes.push(
      ...(AST_EXTENSIONS.has(ext)
        ? astScopes(path, content, scoped)
        : blockScopes(path, lines, scoped)),
    );
  }
  codeIndex = { links, scopes, files };
  return codeIndex;
};

type Anchor =
  | { kind: "scope"; path: string; label: string; hash: string }
  | { kind: "file"; path: string; hash: string }
  | { kind: "quote"; path: string; quote: string }
  | { kind: "test"; path: string; name: string }
  | { kind: "url"; url: string };

interface Claim {
  domain: string;
  id: string;
  ref: string;
  kind: string;
  verified: string;
  heading: string;
  text: string;
  anchors: Anchor[];
  links: string[];
  callout: string[];
  headerLine: number;
  endLine: number;
}

interface Domain {
  name: string;
  summary: string;
  code: RegExp[];
  claims: Map<string, Claim>;
  decisions: Map<string, { title: string; status: string }>;
  currentPath: string;
}

const CLAIM_KINDS = ["behaviour", "structure", "rationale", "external"];
const CALLOUT_HEADER =
  /^> \[!sources\]-? (\w+) · verified (\d{4}-\d{2}-\d{2}|pending)\s*$/;
const CLAIM_MARKER = new RegExp(`(?:^|\\s)\\^(${SLUG})\\s*$`);

const containsQuote = function (content: string, quote: string): boolean {
  const norm = function (s: string) {
    return s.replace(/\s+/g, " ");
  };
  const text = norm(content);
  return (
    text.includes(norm(quote)) ||
    text.includes(norm(quote.replace(/\\(["\\])/g, "$1")))
  );
};

const parseAnchor = function (line: string): Anchor | "link" | null {
  let m: RegExpMatchArray | null;
  if ((m = line.match(/^> - test: `([^`]+)` › "(.+)"\s*$/)))
    return { kind: "test", path: group(m, 1), name: group(m, 2) };
  if ((m = line.match(/^> - url: <([^>]+)>\s*$/)))
    return { kind: "url", url: group(m, 1) };
  if (/^> - (why|from): /.test(line)) return "link";
  if ((m = line.match(/^> - `([^`]+)` › `([^`]+)` · #([0-9a-f]{8})\s*$/)))
    return {
      kind: "scope",
      path: group(m, 1),
      label: group(m, 2),
      hash: group(m, 3),
    };
  if ((m = line.match(/^> - `([^`]+)` › "(.+)"\s*$/)))
    return { kind: "quote", path: group(m, 1), quote: group(m, 2) };
  if ((m = line.match(/^> - `([^`]+)`(?: · #([0-9a-f]{8}))?\s*$/)))
    return { kind: "file", path: group(m, 1), hash: group(m, 2) };
  return null;
};

const parseClaims = function (
  domain: string,
  path: string,
): Map<string, Claim> {
  const claims = new Map<string, Claim>();
  const lines = read(path).split("\n");
  const where = rel(path);
  let heading = "";
  let inFence = false;
  let paragraph: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = at(lines, i);
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const h = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (h) {
      heading = group(h, 1);
      paragraph = [];
      continue;
    }
    if (line.startsWith("> [!sources]")) {
      report(
        "error",
        `${where}:${i + 1}`,
        "sources callout without a claim marker above it",
      );
      while (i + 1 < lines.length && at(lines, i + 1).startsWith(">")) i++;
      continue;
    }
    if (line.trim() === "") {
      paragraph = [];
      continue;
    }
    paragraph.push(line);
    const marker = line.match(CLAIM_MARKER);
    if (!marker) continue;
    const id = group(marker, 1);
    let j = i + 1;
    while (j < lines.length && at(lines, j).trim() === "") j++;
    const header = at(lines, j)?.match(CALLOUT_HEADER);
    if (!header) {
      report(
        "error",
        `${where}:${i + 1}`,
        `claim ${id} has no valid sources callout below it`,
      );
      continue;
    }
    if (!CLAIM_KINDS.includes(group(header, 1))) {
      report(
        "error",
        `${where}:${j + 1}`,
        `claim ${id} kind "${group(header, 1)}" must be ${CLAIM_KINDS.join("|")}`,
      );
    }
    const claim: Claim = {
      domain,
      id,
      ref: `${domain}/${id}`,
      kind: group(header, 1),
      verified: group(header, 2),
      heading,
      text: paragraph.join(" ").replace(CLAIM_MARKER, "").trim(),
      anchors: [],
      links: [],
      callout: [],
      headerLine: j,
      endLine: j,
    };
    for (j = j + 1; j < lines.length && at(lines, j).startsWith(">"); j++) {
      claim.callout.push(at(lines, j));
      claim.endLine = j;
      const anchor = parseAnchor(at(lines, j));
      if (anchor === null) {
        report(
          "error",
          `${where}:${j + 1}`,
          `unrecognised source line in ${id}: ${at(lines, j)}`,
        );
      } else if (anchor === "link") {
        claim.links.push(...wikilinks(at(lines, j)));
      } else {
        claim.anchors.push(anchor);
      }
    }
    if (claims.has(id)) report("error", where, `duplicate claim ${id}`);
    claims.set(id, claim);
    i = j - 1;
    paragraph = [];
  }
  return claims;
};

const anchorPath = function (anchor: Anchor): string | null {
  return anchor.kind === "url" ? null : anchor.path;
};

const fileHash = function (path: string): string {
  const full = join(ROOT, path);
  if (!existsSync(full) || !statSync(full).isFile()) return "";
  return hash8(read(full).replace(/\s+/g, " ").trim());
};

const checkAnchor = function (anchor: Anchor): string | null {
  const path = anchorPath(anchor);
  if (path === null || anchor.kind === "scope") return null;
  const full = join(ROOT, path);
  if (!existsSync(full)) return `missing file ${path}`;
  if (anchor.kind === "quote") {
    return containsQuote(read(full), anchor.quote)
      ? null
      : `quote not found in ${path}: "${anchor.quote}"`;
  }
  if (anchor.kind === "test") {
    return containsQuote(read(full), anchor.name)
      ? null
      : `test "${anchor.name}" not found in ${path}`;
  }
  return null;
};

type ClaimStatus = "broken" | "changed" | "unverified" | "fresh";
interface Evidence {
  status: ClaimStatus;
  details: string[];
  live: Scope[];
}

const liveScopes = function (claim: Claim, index: CodeIndex): Scope[] {
  return index.scopes
    .filter(function (scope) {
      return scope.claims.includes(claim.ref);
    })
    .sort(function (a, b) {
      return a.path.localeCompare(b.path) || a.line - b.line;
    });
};

// @claim infra/claim-verification
const claimEvidence = function (claim: Claim, index: CodeIndex): Evidence {
  const live = liveScopes(claim, index);
  const problems = claim.anchors.map(checkAnchor).filter(Boolean) as string[];
  const key = function (path: string, label: string) {
    return `${path} › ${label}`;
  };
  const stored = new Map<string, string>();
  for (const anchor of claim.anchors) {
    if (anchor.kind === "scope")
      stored.set(key(anchor.path, anchor.label), anchor.hash);
  }
  const changes: string[] = [];
  const seen = new Set<string>();
  for (const scope of live) {
    const k = key(scope.path, scope.label);
    seen.add(k);
    if (!stored.has(k)) changes.push(`new link ${k}`);
    else if (stored.get(k) !== scope.hash) changes.push(`changed ${k}`);
  }
  for (const k of stored.keys()) {
    if (!seen.has(k)) changes.push(`link gone ${k}`);
  }
  for (const anchor of claim.anchors) {
    if (anchor.kind !== "file") continue;
    const current = fileHash(anchor.path);
    if (current && anchor.hash !== current)
      changes.push(`changed ${anchor.path}`);
  }
  if (problems.length > 0) return { status: "broken", details: problems, live };
  if (changes.length > 0) return { status: "changed", details: changes, live };
  if (claim.verified === "pending")
    return { status: "unverified", details: ["never stamped"], live };
  return { status: "fresh", details: [], live };
};

const loadDomains = function (): Map<string, Domain> {
  const domains = new Map<string, Domain>();
  const root = join(JOURNAL, "domains");
  for (const name of listDirs(root)) {
    const where = `journal/domains/${name}`;
    if (!(DOMAINS as readonly string[]).includes(name)) {
      report("error", where, `unknown domain; expected ${DOMAINS.join("|")}`);
    }
    const currentPath = join(root, name, "current.md");
    const decisionsPath = join(root, name, "decisions.md");
    if (!existsSync(currentPath)) {
      report("error", where, "missing current.md");
      continue;
    }
    const fm = parseFrontmatter(read(currentPath), `${where}/current.md`) ?? {};
    if (str(fm, "domain") !== name) {
      report(
        "error",
        `${where}/current.md`,
        `frontmatter domain must be "${name}"`,
      );
    }
    if (!str(fm, "summary"))
      report("error", `${where}/current.md`, "missing summary");
    const globs = list(fm, "code");
    if (globs.length === 0)
      report("error", `${where}/current.md`, "missing code globs");
    const decisions = new Map<string, { title: string; status: string }>();
    if (existsSync(decisionsPath)) {
      const content = read(decisionsPath);
      const ids = blockIds(content);
      const sections = content.split(/^(?=### D\d{3} — )/m).slice(1);
      for (const section of sections) {
        const m = section.match(/^### (D\d{3}) — (.+)$/m)!;
        const status = section.match(/^- Status: (\S+)/m)?.[1] ?? "";
        if (!["accepted", "superseded"].includes(status)) {
          report(
            "error",
            `${where}/decisions.md`,
            `${group(m, 1)} status must be accepted|superseded`,
          );
        }
        if (!ids.has(group(m, 1))) {
          report(
            "error",
            `${where}/decisions.md`,
            `${group(m, 1)} missing its ^${group(m, 1)} block marker`,
          );
        }
        if (decisions.has(group(m, 1)))
          report("error", `${where}/decisions.md`, `duplicate ${group(m, 1)}`);
        decisions.set(group(m, 1), { title: group(m, 2), status });
      }
    } else {
      report("error", where, "missing decisions.md");
    }
    domains.set(name, {
      name,
      summary: str(fm, "summary"),
      code: globs.map(globToRegExp),
      claims: parseClaims(name, currentPath),
      decisions,
      currentPath,
    });
  }
  return domains;
};

const findClaim = function (
  domains: Map<string, Domain>,
  ref: string,
): Claim | undefined {
  const [domain = "", id = ""] = ref.split("/");
  return domains.get(domain)?.claims.get(id);
};

const validateDomains = function (
  domains: Map<string, Domain>,
  index: CodeIndex,
) {
  for (const domain of domains.values()) {
    const where = rel(domain.currentPath);
    checkLinks(where, read(domain.currentPath));
    const decisionsPath = join(dirname(domain.currentPath), "decisions.md");
    if (existsSync(decisionsPath))
      checkLinks(rel(decisionsPath), read(decisionsPath));
    for (const claim of domain.claims.values()) {
      const at = `${where} ^${claim.id}`;
      const manual = claim.anchors.filter(function (a) {
        return a.kind !== "url" && a.kind !== "scope";
      });
      if (claim.kind === "rationale" && claim.links.length === 0) {
        report("error", at, "rationale claim needs a why: link");
      }
      if (
        claim.kind === "external" &&
        !claim.anchors.some(function (a) {
          return a.kind === "url";
        })
      ) {
        report("error", at, "external claim needs a url: anchor");
      }
      if (
        claim.kind !== "rationale" &&
        claim.kind !== "external" &&
        manual.length === 0 &&
        liveScopes(claim, index).length === 0
      ) {
        report(
          "error",
          at,
          "claim cites no code (add an @claim link or a source line)",
        );
      }
      for (const anchor of claim.anchors) {
        const problem = checkAnchor(anchor);
        if (problem) report("error", at, problem);
      }
    }
  }
};

const ownerOf = function (
  domains: Map<string, Domain>,
  file: string,
): string[] {
  return [...domains.values()]
    .filter(function (d) {
      return d.code.some(function (re) {
        return re.test(file);
      });
    })
    .map(function (d) {
      return d.name;
    });
};

const needsFileLink = function (file: string): boolean {
  return (
    /^(apps|packages)\/.*\.tsx?$/.test(file) &&
    !/\.d\.ts$|\.test\.tsx?$/.test(file)
  );
};

// @claim infra/journal-check infra/code-links
const validateOwnership = function (
  domains: Map<string, Domain>,
  index: CodeIndex,
) {
  if (domains.size === 0) return;
  const fileLinks = new Map<string, Link>();
  for (const link of index.links) {
    if (link.file) fileLinks.set(link.path, link);
  }
  for (const file of workspaceFiles()) {
    const owners = ownerOf(domains, file);
    if (owners.length === 0)
      report("error", file, "no domain owns this file (add a code glob)");
    if (owners.length > 1)
      report("error", file, `owned by several domains: ${owners.join(", ")}`);
    if (needsFileLink(file) && !fileLinks.has(file))
      report("error", file, "missing its first-line @claim <domain>[/<claim>]");
  }
  for (const link of index.links) {
    const at = `${link.path}:${link.line + 1}`;
    for (const target of link.targets) {
      const m = target.match(LINK_TARGET);
      if (!m) {
        report(
          "error",
          at,
          `@claim target "${target}" must be <domain>[/<claim>]`,
        );
        continue;
      }
      if (!link.file && !group(m, 2)) {
        report(
          "error",
          at,
          `@claim on a scope must name a claim: ${target}/<claim>`,
        );
        continue;
      }
      if (group(m, 2) && !domains.get(group(m, 1))?.claims.has(group(m, 2))) {
        report("error", at, `@claim ${target} does not exist`);
      }
      if (link.file) {
        const owners = ownerOf(domains, link.path);
        if (owners.length === 1 && group(m, 1) !== owners[0])
          report(
            "error",
            at,
            `@claim names ${group(m, 1)} but ${owners[0]} owns this file`,
          );
      }
    }
  }
};

interface Item {
  id: string;
  slug: string;
  title: string;
  state: string;
  horizon: string;
  domains: string[];
  dependsOn: string[];
  convergesWith: string[];
  splitFrom: string[];
  absorbedInto: string;
  feature: string;
  touched: string;
  path: string;
}

const ITEM_KEYS = [
  "id",
  "title",
  "state",
  "horizon",
  "domains",
  "depends-on",
  "converges-with",
  "split-from",
  "absorbed-into",
  "feature",
  "origin",
  "touched",
];
const ITEM_STATES = [
  "idea",
  "shaped",
  "graduated",
  "shipped",
  "absorbed",
  "dropped",
];
const ACTIVE_STATES = ["idea", "shaped", "graduated"];
const HORIZONS = ["now", "next", "later", "maybe"];

const itemRef = function (link: string): string | null {
  return link.match(/^roadmap\/items\/(R\d{3})-/)?.[1] ?? null;
};

const loadItems = function (): Map<string, Item> {
  const items = new Map<string, Item>();
  for (const path of listFiles(join(JOURNAL, "roadmap", "items"))) {
    const where = rel(path);
    const name = basename(path, ".md");
    const m = name.match(/^(R\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/);
    if (!m) {
      report("error", where, "filename must be R###-<kebab-slug>.md");
      continue;
    }
    const content = read(path);
    const fm = parseFrontmatter(content, where);
    if (!fm) {
      report("error", where, "missing frontmatter");
      continue;
    }
    for (const key of Object.keys(fm)) {
      if (!ITEM_KEYS.includes(key))
        report("error", where, `unknown frontmatter key "${key}"`);
    }
    for (const key of ITEM_KEYS) {
      if (!(key in fm))
        report("error", where, `missing frontmatter key "${key}"`);
    }
    const links = function (key: string) {
      return list(fm, key).flatMap(wikilinks);
    };
    const item: Item = {
      id: str(fm, "id"),
      slug: group(m, 2),
      title: str(fm, "title"),
      state: str(fm, "state"),
      horizon: str(fm, "horizon"),
      domains: list(fm, "domains"),
      dependsOn: links("depends-on"),
      convergesWith: links("converges-with"),
      splitFrom: links("split-from"),
      absorbedInto: wikilinks(str(fm, "absorbed-into"))[0] ?? "",
      feature: str(fm, "feature"),
      touched: str(fm, "touched"),
      path,
    };
    if (item.id !== group(m, 1))
      report(
        "error",
        where,
        `id ${item.id} must match filename ${group(m, 1)}`,
      );
    if (!item.title) report("error", where, "missing title");
    if (!ITEM_STATES.includes(item.state))
      report("error", where, `state must be ${ITEM_STATES.join("|")}`);
    if (!HORIZONS.includes(item.horizon))
      report("error", where, `horizon must be ${HORIZONS.join("|")}`);
    for (const d of item.domains) {
      if (!(DOMAINS as readonly string[]).includes(d))
        report("error", where, `unknown domain "${d}"`);
    }
    if (list(fm, "origin").length === 0)
      report("error", where, "origin must not be empty");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.touched))
      report("error", where, "touched must be YYYY-MM-DD");
    if (["graduated", "shipped"].includes(item.state) && !item.feature) {
      report("error", where, `${item.state} item needs feature`);
    }
    if (item.feature && !existsSync(join(JOURNAL, "features", item.feature))) {
      report("error", where, `feature ${item.feature} does not exist`);
    }
    if ((item.state === "absorbed") !== Boolean(item.absorbedInto)) {
      report(
        "error",
        where,
        "absorbed-into is required exactly when state is absorbed",
      );
    }
    if (!/^## Idea\s*$/m.test(content))
      report("error", where, "body needs a ## Idea section");
    if (items.has(item.id)) report("error", where, `duplicate id ${item.id}`);
    items.set(item.id, item);
  }
  return items;
};

const validateItems = function (items: Map<string, Item>) {
  for (const item of items.values()) {
    const where = rel(item.path);
    checkLinks(where, read(item.path));
    const edges = [
      ...item.dependsOn,
      ...item.convergesWith,
      ...item.splitFrom,
      ...(item.absorbedInto ? [item.absorbedInto] : []),
    ];
    for (const link of edges) {
      if (!itemRef(link))
        report("error", where, `edge [[${link}]] must point at a roadmap item`);
    }
    for (const link of item.convergesWith) {
      const other = items.get(itemRef(link) ?? "");
      if (
        other &&
        !other.convergesWith.some(function (l) {
          return itemRef(l) === item.id;
        })
      ) {
        report("error", where, `converges-with ${other.id} is not reciprocal`);
      }
    }
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = function (id: string, trail: string[]) {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      report(
        "error",
        "journal/roadmap",
        `depends-on cycle: ${[...trail, id].join(" → ")}`,
      );
      return;
    }
    visiting.add(id);
    for (const link of items.get(id)?.dependsOn ?? []) {
      const dep = itemRef(link);
      if (dep) visit(dep, [...trail, id]);
    }
    visiting.delete(id);
    done.add(id);
  };
  for (const id of items.keys()) visit(id, []);
};

interface PlanItem {
  id: string;
  title: string;
  phase: string;
  state: string;
  refs: { path: string; role: string }[];
  decisions: string[];
  addresses: string[];
}

interface PlanEntry {
  id: string;
  title: string;
  status: string;
  extra: string;
}

interface Checkpoint {
  summary: string;
  next: string[];
  blockers: string[];
  note: string;
}

interface Task {
  id: string;
  feature: string;
  dir: string;
  status: string;
  role: string;
  items: string[];
}

interface Feature {
  name: string;
  path: string;
  lifecycle: string;
  summary: string;
  roadmap: string;
  context: string[];
  checkpoint: Checkpoint;
  phases: { id: string; title: string }[];
  items: PlanItem[];
  decisions: Map<string, PlanEntry>;
  gaps: Map<string, PlanEntry>;
  tasks: Task[];
}

const PLAN_KEYS = [
  "owner",
  "lifecycle",
  "summary",
  "topics",
  "supersedes",
  "superseded-by",
  "roadmap",
  "context",
  "checkpoint",
];
const LIFECYCLES = [
  "draft",
  "accepted",
  "implementing",
  "shipped",
  "abandoned",
  "superseded",
];
const PLAN_ITEM_STATES = [
  "planned",
  "in_progress",
  "implemented",
  "verified",
  "deferred",
  "dropped",
];
const TERMINAL = ["deferred", "dropped"];
const DONE_STATES = ["implemented", "verified", ...TERMINAL];
const DECISION_STATES = ["proposed", "accepted", "superseded"];
const GAP_STATES = ["open", "planned", "resolved", "dismissed"];
const TASK_STATUSES = [
  "draft",
  "running",
  "plan-ready",
  "done",
  "blocked",
  "failed",
  "restart",
  "lost",
  "accepted",
  "closed",
];
const TASK_ROLES = ["implementer", "reviewer", "probe"];
const TASK_GATES = ["none", "plan"];
const seenTasks = new Map<string, string>();

// @claim infra/feature-plans
const phaseState = function (items: PlanItem[]): string {
  if (
    items.every(function (i) {
      return i.state === "planned";
    })
  )
    return "planned";
  if (
    items.every(function (i) {
      return DONE_STATES.includes(i.state);
    })
  )
    return "implemented";
  return "in_progress";
};

// @claim infra/feature-plans
const parsePlanBody = function (content: string) {
  const lines = stripFences(content.replace(FRONTMATTER, ""));
  const phases: { id: string; title: string }[] = [];
  const items: PlanItem[] = [];
  const decisions = new Map<string, PlanEntry>();
  const gaps = new Map<string, PlanEntry>();
  const duplicates: string[] = [];
  let item: PlanItem | null = null;
  let entry: { target: PlanEntry; kind: "decision" | "gap" } | null = null;
  let inRefs = false;
  for (const line of lines) {
    const h2 = line.match(/^## (?:(P\d{2}) — (.+)|.*)$/);
    if (h2) {
      item = null;
      entry = null;
      inRefs = false;
      if (group(h2, 1)) phases.push({ id: group(h2, 1), title: group(h2, 2) });
      continue;
    }
    const h3 = line.match(/^### ((P\d{2})-I\d{2}|D\d{3}|G\d{3}) — (.+?)\s*$/);
    if (h3) {
      inRefs = false;
      item = null;
      entry = null;
      const id = group(h3, 1);
      const itemPhase = group(h3, 2);
      const title = group(h3, 3);
      if (itemPhase) {
        item = {
          id,
          title,
          phase: itemPhase,
          state: "",
          refs: [],
          decisions: [],
          addresses: [],
        };
        if (
          items.some(function (i) {
            return i.id === id;
          })
        )
          duplicates.push(id);
        items.push(item);
      } else {
        const target = { id, title, status: "", extra: "" };
        const map = id.startsWith("D") ? decisions : gaps;
        if (map.has(id)) duplicates.push(id);
        map.set(id, target);
        entry = { target, kind: id.startsWith("D") ? "decision" : "gap" };
      }
      continue;
    }
    if (/^#{1,3} /.test(line)) {
      item = null;
      entry = null;
      inRefs = false;
      continue;
    }
    const field = line.match(/^- ([A-Z][A-Za-z ]*?): ?(.*)$/);
    if (item && field) {
      inRefs = group(field, 1) === "Refs";
      if (group(field, 1) === "State") item.state = group(field, 2).trim();
      if (group(field, 1) === "Decisions")
        item.decisions = group(field, 2).match(/D\d{3}/g) ?? [];
      if (group(field, 1) === "Addresses")
        item.addresses = group(field, 2).match(/G\d{3}/g) ?? [];
      if (inRefs) {
        for (const m of group(field, 2).matchAll(/`([^`]+)`/g))
          item.refs.push({ path: group(m, 1), role: "" });
      }
      continue;
    }
    if (item && inRefs) {
      const ref = line.match(/^\s+- `([^`]+)`(?: — (.*))?$/);
      if (ref) {
        item.refs.push({ path: group(ref, 1), role: group(ref, 2) });
        continue;
      }
      if (line.trim() !== "") inRefs = false;
    }
    if (entry && field) {
      if (group(field, 1) === "Status")
        entry.target.status = group(field, 2).trim();
      if (entry.kind === "decision" && group(field, 1) === "Ruling")
        entry.target.extra = group(field, 2).trim();
      if (entry.kind === "gap" && group(field, 1) === "Recommendation")
        entry.target.extra = group(field, 2).trim();
    }
  }
  return { phases, items, decisions, gaps, duplicates };
};

const readCheckpoint = function (fm: Fm): Checkpoint {
  const raw = fm.checkpoint;
  const cp =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Fm) : {};
  return {
    summary: str(cp, "summary"),
    next: list(cp, "next"),
    blockers: list(cp, "blockers"),
    note: str(cp, "note"),
  };
};

// @claim infra/journal-check infra/orchestra
const loadTasks = function (feature: Feature) {
  const root = join(JOURNAL, "features", feature.name, "tasks");
  const itemIds = new Set(
    feature.items.map(function (i) {
      return i.id;
    }),
  );
  for (const id of listDirs(root)) {
    const dir = join(root, id);
    const where = `journal/features/${feature.name}/tasks/${id}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      report("error", where, "task id must be kebab-case");
    }
    const other = seenTasks.get(id);
    if (other) report("error", where, `task id also used in feature ${other}`);
    seenTasks.set(id, feature.name);
    for (const obsolete of ["task.toml", "prompt.md"]) {
      if (existsSync(join(dir, obsolete)))
        report(
          "error",
          where,
          `${obsolete} is obsolete; task state lives in brief.md frontmatter`,
        );
    }
    const briefPath = join(dir, "brief.md");
    if (!existsSync(briefPath)) {
      report("error", where, "missing brief.md");
      continue;
    }
    const fm = parseFrontmatter(read(briefPath), `${where}/brief.md`);
    if (!fm) {
      report(
        "error",
        `${where}/brief.md`,
        "needs frontmatter with the task state",
      );
      continue;
    }
    const status = str(fm, "status");
    const role = str(fm, "role") || "implementer";
    const gate = str(fm, "gate") || "none";
    if (!TASK_STATUSES.includes(status))
      report(
        "error",
        `${where}/brief.md`,
        `status must be ${TASK_STATUSES.join("|")}`,
      );
    if (!TASK_ROLES.includes(role))
      report(
        "error",
        `${where}/brief.md`,
        `role must be ${TASK_ROLES.join("|")}`,
      );
    if (!TASK_GATES.includes(gate))
      report(
        "error",
        `${where}/brief.md`,
        `gate must be ${TASK_GATES.join("|")}`,
      );
    const items = list(fm, "items");
    for (const item of items) {
      if (!itemIds.has(item))
        report("error", `${where}/brief.md`, `item ${item} is not in plan.md`);
    }
    const needs: Record<string, string> = {
      "plan-ready": "plan.md",
      done: "report.md",
      blocked: "report.md",
      failed: "report.md",
      accepted: "report.md",
      restart: "log.md",
    };
    const needed = needs[status];
    if (needed && !existsSync(join(dir, needed)))
      report("error", where, `status ${status} needs ${needed}`);
    feature.tasks.push({ id, feature: feature.name, dir, status, role, items });
  }
};

// @claim infra/journal-check
const loadFeatures = function (items: Map<string, Item>): Feature[] {
  const features: Feature[] = [];
  for (const name of listDirs(join(JOURNAL, "features"))) {
    const dir = join(JOURNAL, "features", name);
    const where = `journal/features/${name}`;
    const planPath = join(dir, "plan.md");
    if (existsSync(join(dir, "implementation.toml"))) {
      report(
        "error",
        where,
        "implementation.toml is merged into plan.md (item State/Refs fields, frontmatter checkpoint)",
      );
    }
    if (!existsSync(planPath)) {
      report("error", where, "missing plan.md");
      continue;
    }
    const plan = read(planPath);
    const at = `${where}/plan.md`;
    const fm = parseFrontmatter(plan, at) ?? {};
    for (const key of Object.keys(fm)) {
      if (!PLAN_KEYS.includes(key))
        report("error", at, `unknown frontmatter key "${key}"`);
    }
    for (const key of ["owner", "lifecycle", "summary", "roadmap"]) {
      if (!str(fm, key)) report("error", at, `missing ${key}`);
    }
    const lifecycle = str(fm, "lifecycle");
    if (!LIFECYCLES.includes(lifecycle))
      report("error", at, `lifecycle must be ${LIFECYCLES.join("|")}`);
    const roadmap = str(fm, "roadmap");
    const item = items.get(roadmap);
    if (roadmap && !item)
      report("error", at, `roadmap ${roadmap} does not exist`);
    if (item && item.feature !== name) {
      report(
        "error",
        at,
        `roadmap ${roadmap} does not point back (feature: "${item.feature}")`,
      );
    }
    const context = list(fm, "context").flatMap(wikilinks);
    for (const link of context) {
      const problem = resolveLink(link);
      if (problem)
        report("error", at, `broken context [[${link}]]: ${problem}`);
    }
    checkLinks(at, plan.replace(FRONTMATTER, ""));
    if (lifecycle === "implementing" && !fm.checkpoint)
      report(
        "error",
        at,
        "an implementing feature needs a frontmatter checkpoint",
      );
    const body = parsePlanBody(plan);
    for (const id of body.duplicates) report("error", at, `duplicate ${id}`);
    for (const planItem of body.items) {
      const ref = `${at} ${planItem.id}`;
      if (!PLAN_ITEM_STATES.includes(planItem.state))
        report("error", ref, `- State: must be ${PLAN_ITEM_STATES.join("|")}`);
      if (
        !body.phases.some(function (p) {
          return p.id === planItem.phase;
        })
      )
        report("error", ref, `phase ${planItem.phase} has no ## heading`);
      for (const d of planItem.decisions) {
        if (!body.decisions.has(d))
          report("error", ref, `references unknown decision ${d}`);
      }
      for (const g of planItem.addresses) {
        if (!body.gaps.has(g))
          report("error", ref, `addresses unknown gap ${g}`);
      }
      for (const r of planItem.refs) {
        if (!existsSync(join(ROOT, r.path)))
          report("error", ref, `ref missing: ${r.path}`);
      }
    }
    for (const d of body.decisions.values()) {
      if (!DECISION_STATES.includes(d.status))
        report(
          "error",
          `${at} ${d.id}`,
          `Status must be ${DECISION_STATES.join("|")}`,
        );
    }
    for (const g of body.gaps.values()) {
      if (!GAP_STATES.includes(g.status))
        report(
          "error",
          `${at} ${g.id}`,
          `Status must be ${GAP_STATES.join("|")}`,
        );
    }
    const checkpoint = readCheckpoint(fm);
    for (const id of checkpoint.next) {
      const target = body.items.find(function (i) {
        return i.id === id;
      });
      if (!target) report("error", at, `checkpoint next ${id} does not exist`);
      else if (TERMINAL.includes(target.state))
        report("error", at, `checkpoint next ${id} is terminal`);
    }
    const feature: Feature = {
      name,
      path: planPath,
      lifecycle,
      summary: str(fm, "summary"),
      roadmap,
      context,
      checkpoint,
      phases: body.phases,
      items: body.items,
      decisions: body.decisions,
      gaps: body.gaps,
      tasks: [],
    };
    loadTasks(feature);
    features.push(feature);
  }
  return features;
};

interface Wireframe {
  path: string;
  status: string;
}

const validateWireframes = function (): Wireframe[] {
  const dirs = [
    join(JOURNAL, "roadmap", "wireframes"),
    ...DOMAINS.map(function (d) {
      return join(JOURNAL, "domains", d, "wireframes");
    }),
  ];
  const out: Wireframe[] = [];
  for (const dir of dirs) {
    for (const path of listFiles(dir)) {
      const where = rel(path);
      const fm = parseFrontmatter(read(path), where) ?? {};
      const status = str(fm, "status");
      if (str(fm, "screen") !== basename(path, ".md"))
        report("error", where, "screen must equal filename");
      if (!["route", "dialog"].includes(str(fm, "kind")))
        report("error", where, "kind must be route|dialog");
      if (!["exploring", "adopted", "superseded"].includes(status)) {
        report("error", where, "status must be exploring|adopted|superseded");
      }
      if (list(fm, "sizes").length === 0)
        report("error", where, "missing sizes");
      if ((status === "superseded") !== Boolean(str(fm, "superseded-by"))) {
        report(
          "error",
          where,
          "superseded-by is required exactly when status is superseded",
        );
      }
      if (status === "adopted" && dir.includes("/roadmap/")) {
        report(
          "error",
          where,
          "adopted wireframes belong in domains/<domain>/wireframes",
        );
      }
      if (status === "exploring" && dir.includes("/domains/")) {
        report(
          "error",
          where,
          "exploring wireframes belong in roadmap/wireframes",
        );
      }
      for (const impl of list(fm, "implements")) {
        if (!existsSync(join(ROOT, impl)))
          report("error", where, `implements path missing: ${impl}`);
      }
      checkLinks(where, read(path));
      out.push({ path, status });
    }
  }
  return out;
};

interface ArchiveEntry {
  name: string;
  units: number;
  mapped: number;
  hasLedger: boolean;
}

const resolveTarget = function (
  target: string,
  items: Map<string, Item>,
  domains: Map<string, Domain>,
): string | null {
  if (target === "dropped" || target === "spec") return null;
  if (/^R\d{3}$/.test(target))
    return items.has(target) ? null : `unknown item ${target}`;
  const claim = target.match(new RegExp(`^(\\w+)/(${SLUG})$`));
  if (claim)
    return domains.get(group(claim, 1))?.claims.has(group(claim, 2))
      ? null
      : `unknown claim ${target}`;
  const decision = target.match(/^(\w+)#(D\d{3})$/);
  if (decision) {
    return domains.get(group(decision, 1))?.decisions.has(group(decision, 2))
      ? null
      : `unknown decision ${target}`;
  }
  if (target.startsWith("feature:")) {
    return existsSync(join(JOURNAL, "features", target.slice(8)))
      ? null
      : `unknown feature ${target}`;
  }
  if (target.startsWith("path:")) {
    return existsSync(join(JOURNAL, target.slice(5)))
      ? null
      : `missing path journal/${target.slice(5)}`;
  }
  return `unrecognised target "${target}"`;
};

const validateArchive = function (
  items: Map<string, Item>,
  domains: Map<string, Domain>,
): ArchiveEntry[] {
  const root = join(JOURNAL, "_archive");
  const out: ArchiveEntry[] = [];
  for (const name of listDirs(root)) {
    const dir = join(root, name);
    const where = `journal/_archive/${name}`;
    const units = new Map<string, Set<string>>();
    for (const path of listFiles(dir)) {
      units.set(relative(dir, path), new Set(headings(read(path), [2, 3])));
    }
    const total = [...units.values()].reduce(function (n, hs) {
      return n + Math.max(hs.size, 1);
    }, 0);
    const ledgerPath = join(dir, "ledger.toml");
    if (!existsSync(ledgerPath)) {
      report("warning", where, "no ledger.toml yet");
      out.push({ name, units: total, mapped: 0, hasLedger: false });
      continue;
    }
    let ledger: Record<string, unknown>;
    try {
      ledger = parseToml(read(ledgerPath)) as Record<string, unknown>;
    } catch (error) {
      report(
        "error",
        `${where}/ledger.toml`,
        `invalid TOML: ${(error as Error).message}`,
      );
      continue;
    }
    if (ledger.entry !== name)
      report("error", `${where}/ledger.toml`, `entry must be "${name}"`);
    const covered = new Map<string, Set<string>>();
    for (const section of (ledger.section ?? []) as Record<string, unknown>[]) {
      const file = String(section.file ?? "");
      const heading = String(section.heading ?? "");
      const to = (section.to ?? []) as string[];
      const at = `${where}/ledger.toml [${file} › ${heading}]`;
      if (!units.has(file)) {
        report("error", at, "file does not exist in the archive entry");
        continue;
      }
      if (heading !== "*" && !units.get(file)!.has(heading)) {
        report("error", at, "heading does not exist in file");
      }
      if (to.length === 0) report("error", at, "to must not be empty");
      for (const target of to) {
        const problem = resolveTarget(target, items, domains);
        if (problem) report("error", at, problem);
      }
      if (!covered.has(file)) covered.set(file, new Set());
      covered.get(file)!.add(heading);
    }
    let mapped = 0;
    for (const [file, hs] of units) {
      const done = covered.get(file) ?? new Set();
      if (done.has("*")) {
        mapped += Math.max(hs.size, 1);
        continue;
      }
      if (hs.size === 0) continue;
      for (const h of hs) {
        if (done.has(h)) mapped++;
        else report("warning", where, `unmapped: ${file} › ${h}`);
      }
    }
    out.push({ name, units: total, mapped, hasLedger: true });
  }
  return out;
};

const itemLink = function (item: Item): string {
  return `[[roadmap/items/${item.id}-${item.slug}|${item.id}]]`;
};

const mermaidLabel = function (item: Item): string {
  return `${item.id} · ${item.title}`.replace(/"/g, "'");
};

const renderRoadmap = function (items: Map<string, Item>): string {
  const all = [...items.values()].sort(function (a, b) {
    return a.id.localeCompare(b.id);
  });
  let out =
    "# Roadmap\n\n<!-- Generated by pnpm journal build. Do not edit. -->\n";
  out +=
    "\nEverything not built yet, one file per item in `roadmap/items/` (a raw idea is an item with `state: idea`).\n";
  const line = function (item: Item) {
    const extra = item.feature
      ? ` · → [[features/${item.feature}/plan|${item.feature}]]`
      : "";
    return `- ${itemLink(item)} ${item.title} — ${item.state} · ${item.domains.join(", ")}${extra}\n`;
  };
  for (const horizon of HORIZONS) {
    const group = all.filter(function (i) {
      return i.horizon === horizon && ACTIVE_STATES.includes(i.state);
    });
    out += `\n## ${horizon.charAt(0).toUpperCase()}${horizon.slice(1)}\n\n`;
    out += group.length > 0 ? group.map(line).join("") : "_none_\n";
  }
  const closed = all.filter(function (i) {
    return !ACTIVE_STATES.includes(i.state);
  });
  out += "\n## Shipped · absorbed · dropped\n\n";
  out += closed.length > 0 ? closed.map(line).join("") : "_none_\n";

  out += "\n## Graph\n\n```mermaid\nflowchart LR\n";
  for (const horizon of HORIZONS) {
    const group = all.filter(function (i) {
      return i.horizon === horizon && ACTIVE_STATES.includes(i.state);
    });
    if (group.length === 0) continue;
    out += `  subgraph ${horizon}\n`;
    for (const item of group)
      out += `    ${item.id}["${mermaidLabel(item)}"]\n`;
    out += "  end\n";
  }
  const referenced = new Set<string>();
  const edges: string[] = [];
  const seenConverge = new Set<string>();
  for (const item of all) {
    for (const link of item.dependsOn) {
      const dep = itemRef(link);
      if (dep) {
        edges.push(`  ${dep} --> ${item.id}`);
        referenced.add(dep);
      }
    }
    for (const link of item.convergesWith) {
      const other = itemRef(link);
      const key = [item.id, other].sort().join("|");
      if (other && !seenConverge.has(key)) {
        seenConverge.add(key);
        edges.push(`  ${item.id} -. converges .- ${other}`);
      }
    }
    for (const link of item.splitFrom) {
      const parent = itemRef(link);
      if (parent) {
        edges.push(`  ${parent} -. split .-> ${item.id}`);
        referenced.add(parent);
      }
    }
    if (item.absorbedInto) {
      const target = itemRef(item.absorbedInto);
      if (target) {
        edges.push(`  ${item.id} -. absorbed .-> ${target}`);
        referenced.add(item.id);
      }
    }
  }
  for (const item of closed) {
    if (referenced.has(item.id))
      out += `  ${item.id}(["${mermaidLabel(item)}"]):::closed\n`;
  }
  out += edges.join("\n") + (edges.length > 0 ? "\n" : "");
  out += "  classDef closed fill:#eee,stroke:#999,color:#666\n```\n";
  return out;
};

const renderIndex = function (
  domains: Map<string, Domain>,
  items: Map<string, Item>,
  features: Feature[],
  wireframes: Wireframe[],
  archive: ArchiveEntry[],
): string {
  let out =
    "# Journal\n\n<!-- Generated by pnpm journal build. Do not edit. -->\n";
  out +=
    "\nContract: [[SPEC]]. Roadmap = intent, domains = built truth, features = in flight.\n";

  out +=
    "\n## Domains\n\n| Domain | Summary | Claims | Decisions |\n|---|---|---|---|\n";
  for (const d of domains.values()) {
    out += `| [[domains/${d.name}/current\\|${d.name}]] | ${d.summary} | ${d.claims.size} | [[domains/${d.name}/decisions\\|${d.decisions.size}]] |\n`;
  }

  out += "\n## Features\n\n";
  if (features.length === 0) out += "_none_\n";
  for (const f of features) {
    out += `- [[features/${f.name}/plan|${f.name}]] — ${f.lifecycle} · ${f.roadmap}\n  ${f.summary}\n`;
    if (f.lifecycle === "implementing" && f.checkpoint.next.length > 0) {
      out += `  next: ${f.checkpoint.next.join(", ")}\n`;
    }
  }

  const active = [...items.values()].filter(function (i) {
    return ACTIVE_STATES.includes(i.state);
  });
  out += `\n## Roadmap\n\n[[roadmap/ROADMAP]] — ${active.length} open items`;
  out += ` (${HORIZONS.map(function (h) {
    return `${h} ${
      active.filter(function (i) {
        return i.horizon === h;
      }).length
    }`;
  }).join(", ")}).\n\n`;
  for (const item of active.filter(function (i) {
    return i.horizon === "now";
  })) {
    out += `- ${itemLink(item)} ${item.title}\n`;
  }

  if (wireframes.length > 0) {
    out += "\n## Wireframes\n\n";
    for (const w of wireframes) out += `- [[${jrel(w.path)}]] — ${w.status}\n`;
  }

  if (archive.length > 0) {
    const units = archive.reduce(function (n, a) {
      return n + a.units;
    }, 0);
    const mapped = archive.reduce(function (n, a) {
      return n + a.mapped;
    }, 0);
    out += `\n## Archive\n\nLegacy entries being retired: ${mapped}/${units} sections mapped.\n\n`;
    for (const a of archive) {
      out += `- \`_archive/${a.name}\` — ${a.hasLedger ? `${a.mapped}/${a.units}` : "no ledger"}\n`;
    }
  }
  return out;
};

const renderAgentsBlock = function (
  domains: Map<string, Domain>,
  items: Map<string, Item>,
  features: Feature[],
): string {
  let out = `${GENERATED_START}\n<!-- Generated by pnpm journal build. Do not edit. -->\n`;
  out += "\n### Code map\n\n| Path | Domain | Description |\n|---|---|---|\n";
  const projects = [
    ...["apps", "packages", "services"].flatMap(function (group) {
      return listDirs(join(ROOT, group)).map(function (name) {
        return `${group}/${name}`;
      });
    }),
    "tooling",
  ].filter(function (project) {
    return existsSync(join(ROOT, project));
  });
  for (const project of projects) {
    const pkg = join(ROOT, project, "package.json");
    const pyproject = join(ROOT, project, "pyproject.toml");
    let description = "";
    if (existsSync(pkg)) description = JSON.parse(read(pkg)).description ?? "";
    else if (existsSync(pyproject))
      description =
        read(pyproject).match(/^description\s*=\s*"(.*)"/m)?.[1] ?? "";
    const owners = ownerOf(domains, `${project}/package.json`).concat(
      ownerOf(domains, `${project}/x`),
    );
    out += `| \`${project}\` | ${[...new Set(owners)].join(", ") || "—"} | ${description} |\n`;
  }
  out += "\n### Domains\n\n";
  for (const d of domains.values()) {
    out += `- \`journal/domains/${d.name}/current.md\` — ${d.summary}\n`;
  }
  out += "\n### Features in flight\n\n";
  const live = features.filter(function (f) {
    return ["accepted", "implementing"].includes(f.lifecycle);
  });
  if (live.length === 0) out += "_none_\n";
  for (const f of live) {
    out += `- \`journal/features/${f.name}/\` (${f.lifecycle}) — ${f.summary}\n`;
  }
  const now = [...items.values()].filter(function (i) {
    return i.horizon === "now" && ACTIVE_STATES.includes(i.state);
  });
  out += "\n### Roadmap: now\n\n";
  if (now.length === 0) out += "_none_\n";
  for (const item of now) out += `- ${item.id} ${item.title} (${item.state})\n`;
  out += `\n${GENERATED_END}`;
  return out;
};

const withAgentsBlock = function (
  content: string,
  block: string,
): string | null {
  const start = content.indexOf(GENERATED_START);
  const end = content.indexOf(GENERATED_END);
  if (start === -1 || end === -1) return null;
  return (
    content.slice(0, start) + block + content.slice(end + GENERATED_END.length)
  );
};

const loadAll = function () {
  const domains = loadDomains();
  const items = loadItems();
  const features = loadFeatures(items);
  return { domains, items, features };
};

const outputs = function (state: ReturnType<typeof loadAll>) {
  const wireframes = validateWireframes();
  const archive = validateArchive(state.items, state.domains);
  const files: [string, string][] = [
    [
      join(JOURNAL, "_index.md"),
      renderIndex(
        state.domains,
        state.items,
        state.features,
        wireframes,
        archive,
      ),
    ],
    [join(JOURNAL, "roadmap", "ROADMAP.md"), renderRoadmap(state.items)],
  ];
  if (existsSync(AGENTS_PATH)) {
    const next = withAgentsBlock(
      read(AGENTS_PATH),
      renderAgentsBlock(state.domains, state.items, state.features),
    );
    if (next === null)
      report("error", "AGENTS.md", "missing journal:generated markers");
    else files.push([AGENTS_PATH, next]);
  }
  return { files, archive };
};

const printIssues = function (): number {
  const errors = issues.filter(function (i) {
    return i.level === "error";
  });
  const warnings = issues.length - errors.length;
  for (const issue of issues) {
    console.log(
      `  [${issue.level === "error" ? "ERROR" : "WARN"}] ${issue.where}: ${issue.message}`,
    );
  }
  console.log(`\n  ${errors.length} errors, ${warnings} warnings`);
  return errors.length;
};

const allClaims = function (domains: Map<string, Domain>): Claim[] {
  return [...domains.values()].flatMap(function (d) {
    return [...d.claims.values()];
  });
};

const dueClaims = function (domains: Map<string, Domain>, index: CodeIndex) {
  const order: ClaimStatus[] = ["broken", "changed", "unverified"];
  return allClaims(domains)
    .map(function (claim) {
      return { claim, evidence: claimEvidence(claim, index) };
    })
    .filter(function (row) {
      return row.evidence.status !== "fresh";
    })
    .sort(function (a, b) {
      return (
        order.indexOf(a.evidence.status) - order.indexOf(b.evidence.status)
      );
    });
};

// @claim infra/journal-layers infra/journal-check
const commandCheck = function () {
  const state = loadAll();
  const index = indexCode();
  validateDomains(state.domains, index);
  validateItems(state.items);
  validateOwnership(state.domains, index);
  const { files, archive } = outputs(state);
  for (const [path, content] of files) {
    const current = existsSync(path) ? read(path) : "";
    if (current.trim() !== content.trim()) {
      report(
        "error",
        rel(path),
        "generated output is stale; run `pnpm journal build`",
      );
    }
  }
  if (archive.length > 0) {
    const units = archive.reduce(function (n, a) {
      return n + a.units;
    }, 0);
    const mapped = archive.reduce(function (n, a) {
      return n + a.mapped;
    }, 0);
    console.log(`  archive ledger coverage: ${mapped}/${units}`);
  }
  const due = dueClaims(state.domains, index).length;
  if (due > 0)
    console.log(`  ${due} claims need re-verification (pnpm journal drift)`);
  if (printIssues() > 0) process.exit(1);
};

const writeOutputs = function (): string[] {
  const { files } = outputs(loadAll());
  const written: string[] = [];
  for (const [path, content] of files) {
    const next = content.endsWith("\n") ? content : content + "\n";
    if (existsSync(path) && read(path) === next) continue;
    writeFileSync(path, next);
    written.push(rel(path));
  }
  return written;
};

const commandBuild = function () {
  const written = writeOutputs();
  for (const path of written) console.log(`  wrote ${path}`);
  if (written.length === 0) console.log("  generated files already current");
  printIssues();
};

const reportRegenerated = function () {
  const written = writeOutputs();
  if (written.length > 0) console.log(`  regenerated ${written.join(", ")}`);
};

const commandDrift = function (showFiles: boolean) {
  const { domains, items } = loadAll();
  const index = indexCode();
  const due = dueClaims(domains, index);
  console.log("\n## Claims\n");
  for (const { claim, evidence } of due) {
    console.log(
      `  ${evidence.status.padEnd(10)} ${claim.ref.padEnd(34)} ${claim.heading} — ${evidence.details.join("; ")}`,
    );
  }
  const total = allClaims(domains).length;
  console.log(`\n  ${total - due.length}/${total} claims fresh`);

  const now = Date.now();
  const staleItems = [...items.values()].filter(function (i) {
    return (
      ACTIVE_STATES.includes(i.state) &&
      (now - Date.parse(i.touched)) / 86_400_000 > STALE_ITEM_DAYS
    );
  });
  console.log(`\n## Roadmap items untouched for ${STALE_ITEM_DAYS}+ days\n`);
  for (const item of staleItems)
    console.log(`  ${item.id} ${item.title} (touched ${item.touched})`);
  if (staleItems.length === 0) console.log("  none");

  const cited = new Set<string>();
  for (const claim of allClaims(domains)) {
    for (const anchor of claim.anchors) {
      const path = anchorPath(anchor);
      if (path) cited.add(path);
    }
  }
  for (const link of index.links) {
    if (
      link.targets.some(function (t) {
        return t.includes("/");
      })
    )
      cited.add(link.path);
  }
  console.log(
    "\n## Attribution coverage (code files tied to at least one claim)\n",
  );
  const sources = [...index.files].filter(function (f) {
    return !/\.test\.[jt]sx?$/.test(f);
  });
  for (const d of domains.values()) {
    const owned = sources.filter(function (f) {
      return ownerOf(domains, f)[0] === d.name;
    });
    const uncited = owned.filter(function (f) {
      return !cited.has(f);
    });
    console.log(
      `  ${d.name.padEnd(8)} ${owned.length - uncited.length}/${owned.length}`,
    );
    if (showFiles)
      for (const f of uncited) console.log(`           uncited: ${f}`);
  }
};

// @claim infra/claim-verification
const commandGate = function () {
  const { domains } = loadAll();
  const due = dueClaims(domains, indexCode());
  if (due.length === 0) {
    console.log(`  all ${allClaims(domains).length} claims fresh`);
    return;
  }
  console.log(
    `  ${due.length} claims must be re-verified before committing:\n`,
  );
  for (const { claim, evidence } of due) {
    console.log(
      `  ${evidence.status.padEnd(10)} ${claim.ref} — ${evidence.details.join("; ")}`,
    );
  }
  console.log(
    "\n  For each: read the claim and the code it cites; rewrite the paragraph if it is no longer true; then `pnpm journal stamp <domain>/<claim>`.",
  );
  process.exit(1);
};

// @claim infra/claim-verification
const commandStamp = function (target: string | undefined, every: boolean) {
  if (!target && !every) fail(USAGE);
  const [domainName = "", claimId = ""] = every
    ? ["", ""]
    : (target ?? "").split("/");
  const { domains } = loadAll();
  if (!every && !domains.has(domainName)) fail(`unknown domain ${domainName}`);
  const index = indexCode();
  const date = today();
  let stamped = 0;
  for (const domain of domains.values()) {
    if (!every && domain.name !== domainName) continue;
    const lines = read(domain.currentPath).split("\n");
    const claims = [...domain.claims.values()].sort(function (a, b) {
      return b.headerLine - a.headerLine;
    });
    for (const claim of claims) {
      if (claimId && claim.id !== claimId) continue;
      const problems = claim.anchors.map(checkAnchor).filter(Boolean);
      if (problems.length > 0) {
        console.log(`  skip ${claim.ref}: ${problems.join("; ")}`);
        continue;
      }
      const scopes = liveScopes(claim, index).map(function (scope) {
        return `> - \`${scope.path}\` › \`${scope.label}\` · #${scope.hash}`;
      });
      const rest = claim.callout
        .filter(function (line) {
          const anchor = parseAnchor(line);
          return !(anchor && anchor !== "link" && anchor.kind === "scope");
        })
        .map(function (line) {
          const anchor = parseAnchor(line);
          if (!anchor || anchor === "link" || anchor.kind !== "file")
            return line;
          const hash = fileHash(anchor.path);
          return hash
            ? `> - \`${anchor.path}\` · #${hash}`
            : `> - \`${anchor.path}\``;
        });
      lines.splice(
        claim.headerLine,
        claim.endLine - claim.headerLine + 1,
        `> [!sources]- ${claim.kind} · verified ${date}`,
        ...scopes,
        ...rest,
      );
      stamped++;
    }
    writeFileSync(domain.currentPath, lines.join("\n"));
  }
  console.log(`  stamped ${stamped} claim(s) on ${date}`);
  if (claimId && stamped === 0) process.exit(1);
};

// @claim infra/code-links
const commandClaims = function (paths: string[]) {
  if (paths.length === 0) fail(USAGE);
  const { domains } = loadAll();
  const index = indexCode();
  for (const input of paths) {
    const path = relative(ROOT, resolve(process.cwd(), input));
    const tied = new Map<string, string[]>();
    const add = function (ref: string, how: string) {
      if (!tied.has(ref)) tied.set(ref, []);
      tied.get(ref)!.push(how);
    };
    for (const link of index.links) {
      if (link.path !== path) continue;
      for (const target of link.targets)
        add(target, link.file ? "file link" : `line ${link.line + 1}`);
    }
    for (const scope of index.scopes) {
      if (scope.path !== path) continue;
      for (const ref of scope.claims) {
        const hows = tied.get(ref) ?? [];
        const i = hows.indexOf(`line ${scope.line + 1}`);
        if (i !== -1) hows[i] = `${scope.label} (line ${scope.line + 1})`;
      }
    }
    for (const claim of allClaims(domains)) {
      for (const anchor of claim.anchors) {
        if (
          anchor.kind !== "url" &&
          anchor.kind !== "scope" &&
          anchor.path === path
        )
          add(claim.ref, `cited as ${anchor.kind}`);
      }
    }
    console.log(
      `## ${path} (owned by ${ownerOf(domains, path).join(", ") || "no domain"})\n`,
    );
    if (tied.size === 0) console.log("  no claims\n");
    for (const [ref, hows] of tied) {
      const claim = findClaim(domains, ref);
      if (!claim) {
        console.log(`- ${ref} — ${hows.join(", ")}`);
        continue;
      }
      const status = claimEvidence(claim, index).status;
      console.log(
        `- ${ref} [${status}] — ${hows.join(", ")}\n  ${claim.text.slice(0, 240)}`,
      );
    }
    console.log("");
  }
};

const loadFeature = function (name: string | undefined): Feature {
  if (!name) fail(USAGE);
  const { features } = loadAll();
  const feature = features.find(function (f) {
    return f.name === name;
  });
  if (!feature) return fail(`unknown feature ${name}`);
  return feature;
};

// @claim infra/feature-plans
const commandSet = function (positionals: string[], refValues: string[]) {
  const [name, itemId, state] = positionals;
  if (!state || !PLAN_ITEM_STATES.includes(state))
    fail(`${USAGE}\n\nstate must be ${PLAN_ITEM_STATES.join("|")}`);
  const feature = loadFeature(name);
  if (
    !feature.items.some(function (i) {
      return i.id === itemId;
    })
  )
    fail(`${itemId} is not an item of ${name}`);
  const refs = refValues.map(function (value) {
    const [path = "", role = ""] = value.split("=");
    return { path, role };
  });
  const lines = read(feature.path).split("\n");
  const start = lines.findIndex(function (line) {
    return line.startsWith(`### ${itemId} — `);
  });
  let end = start + 1;
  while (end < lines.length && !/^#{1,3} /.test(at(lines, end))) end++;
  let last = end - 1;
  while (last > start && at(lines, last).trim() === "") last--;
  const stateLine = lines.findIndex(function (line, i) {
    return i > start && i < end && line.startsWith("- State:");
  });
  if (stateLine !== -1) lines[stateLine] = `- State: ${state}`;
  else {
    lines.splice(last + 1, 0, `- State: ${state}`);
    last++;
    end++;
  }
  if (refs.length > 0) {
    let refsLine = lines.findIndex(function (line, i) {
      return i > start && i < end && line.startsWith("- Refs:");
    });
    if (refsLine === -1) {
      lines.splice(last + 1, 0, "- Refs:");
      refsLine = last + 1;
    }
    let insertAt = refsLine + 1;
    const existing = new Set<string>();
    while (insertAt < lines.length && /^\s+- `/.test(at(lines, insertAt))) {
      existing.add(group(at(lines, insertAt).match(/`([^`]+)`/), 1));
      insertAt++;
    }
    for (const ref of refs) {
      if (existing.has(ref.path)) continue;
      lines.splice(
        insertAt,
        0,
        `  - \`${ref.path}\`${ref.role ? ` — ${ref.role}` : ""}`,
      );
      insertAt++;
    }
  }
  writeFileSync(feature.path, lines.join("\n"));
  console.log(
    `  ${name} ${itemId} → ${state}${refs.length > 0 ? ` (+${refs.length} refs)` : ""}`,
  );
  reportRegenerated();
};

// @claim infra/feature-plans
const commandCheckpoint = function (name: string | undefined, values: Values) {
  const feature = loadFeature(name);
  const current = feature.checkpoint;
  const text = function (key: string): string | null {
    const value = values[key];
    return typeof value === "string" ? value : null;
  };
  const summary = text("summary");
  const next = text("next");
  const blockers = text("blockers");
  const note = text("note");
  const split = function (value: string, separator: RegExp) {
    return value
      .split(separator)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  };
  const updated: Checkpoint = {
    summary: summary ?? current.summary,
    next: next === null ? current.next : split(next, /[,\s]+/),
    blockers: blockers === null ? current.blockers : split(blockers, /\|/),
    note: values["clear-note"] === true ? "" : (note ?? current.note),
  };
  writeFileSync(
    feature.path,
    setFrontmatterKey(read(feature.path), "checkpoint", updated),
  );
  console.log(`  ${feature.name} checkpoint updated`);
  reportRegenerated();
};

const liveWindows = function (): Set<string> {
  if (!process.env.TMUX) return new Set();
  return new Set(
    tmux("list-windows", "-F", "#{window_name}")
      .split("\n")
      .filter(function (name) {
        return name.startsWith("w:");
      })
      .map(function (name) {
        return name.slice(2);
      }),
  );
};

// @claim infra/handoff
const renderHandoff = function (
  feature: Feature,
  domains: Map<string, Domain>,
): string {
  const index = indexCode();
  const cp = feature.checkpoint;
  const out: string[] = [
    `# Handoff — ${feature.name}`,
    "",
    `${feature.summary}`,
    `Lifecycle ${feature.lifecycle} · roadmap ${feature.roadmap} · plan journal/features/${feature.name}/plan.md`,
    "",
    "## Checkpoint",
    "",
    cp.summary || "_no summary_",
    `next: ${cp.next.join(", ") || "—"}`,
    `blockers: ${cp.blockers.join("; ") || "none"}`,
    "",
    "## Note from the previous session",
    "",
    cp.note || "_none_",
  ];
  const rulings = [...feature.decisions.values()].filter(function (d) {
    return d.extra && d.status === "accepted";
  });
  if (rulings.length > 0) {
    out.push("", "## Owner rulings (recorded verbatim; do not reopen)", "");
    for (const d of rulings) out.push(`- ${d.id} ${d.title}: ${d.extra}`);
  }
  const open = [...feature.gaps.values()].filter(function (g) {
    return g.status === "open";
  });
  if (open.length > 0) {
    out.push("", "## Open questions", "");
    for (const g of open)
      out.push(
        `- ${g.id} ${g.title}${g.extra ? ` — recommended: ${g.extra}` : ""}`,
      );
  }
  out.push("", "## Items", "");
  for (const phase of feature.phases) {
    const items = feature.items.filter(function (i) {
      return i.phase === phase.id;
    });
    out.push(`- ${phase.id} ${phase.title} — ${phaseState(items)}`);
    for (const item of items) {
      if (!DONE_STATES.includes(item.state))
        out.push(`  - ${item.id} ${item.title} — ${item.state}`);
    }
  }
  if (feature.tasks.length > 0) {
    const live = liveWindows();
    out.push("", "## Tasks", "");
    for (const task of feature.tasks) {
      out.push(
        `- ${task.id} — ${task.status} · ${task.role}${task.items.length > 0 ? ` · ${task.items.join(", ")}` : ""}${live.has(task.id) ? " · window live" : ""}`,
      );
    }
  }
  const contextRefs = feature.context
    .map(function (link) {
      const m = link.match(/^domains\/(\w+)\/current#\^(.+)$/);
      return m ? `${m[1]}/${m[2]}` : "";
    })
    .filter(Boolean);
  const due = contextRefs.filter(function (ref) {
    const claim = findClaim(domains, ref);
    return claim && claimEvidence(claim, index).status !== "fresh";
  });
  out.push(
    "",
    "## Context",
    "",
    `Claims this feature relies on: ${contextRefs.join(", ") || "none"}${due.length > 0 ? ` (re-verify: ${due.join(", ")})` : ""}.`,
  );
  return out.join("\n");
};

const commandHandoff = function (name: string | undefined) {
  const feature = loadFeature(name);
  const { domains } = loadAll();
  console.log(renderHandoff(feature, domains));
};

type Role =
  | { kind: "worker"; task: string; root: string }
  | { kind: "orchestrator"; feature: string }
  | { kind: "session" };

// @claim infra/session-hook
const sessionRole = function (): Role {
  const pane = process.env.TMUX_PANE;
  if (!process.env.TMUX || !pane) return { kind: "session" };
  const window = tmux("display-message", "-p", "-t", pane, "#{window_name}");
  if (window.startsWith("w:"))
    return {
      kind: "worker",
      task: window.slice(2),
      root: process.env.ORCHESTRA_ROOT || ROOT,
    };
  if (tmux("show-options", "-v", "-t", pane, "@orchestra_pane") === pane) {
    const feature = tmux(
      "show-options",
      "-v",
      "-t",
      pane,
      "@orchestra_feature",
    );
    if (feature) return { kind: "orchestrator", feature };
  }
  return { kind: "session" };
};

const workerBrief = function (task: string, root: string): string {
  const features = join(root, "journal", "features");
  const dir = listDirs(features)
    .map(function (f) {
      return join(features, f, "tasks", task);
    })
    .find(function (d) {
      return existsSync(join(d, "brief.md"));
    });
  if (!dir)
    return `You run in orchestra window w:${task}, but no task record was found under ${features}.`;
  const fm = parseFrontmatter(read(join(dir, "brief.md"))) ?? {};
  const log = join(dir, "log.md");
  return [
    `You are the orchestra worker for task '${task}' (role ${str(fm, "role") || "implementer"}, status ${str(fm, "status")}).`,
    `Protocol: ${join(root, ".agents/skills/orchestrate/WORKER.md")}. Brief: ${join(dir, "brief.md")}.`,
    existsSync(log)
      ? `Your log exists (${log}): you are resuming. Read it and continue where it ends.`
      : `Keep your log at ${log}; write plan.md and report.md next to the brief.`,
  ].join("\n");
};

const sessionBrief = function (failing: boolean): string {
  const { domains, features } = loadAll();
  const live = features.filter(function (f) {
    return ["accepted", "implementing"].includes(f.lifecycle);
  });
  const out: string[] = [
    "Journal: roadmap = intent, domains = built truth (claims tied to code by @claim links), features = work in flight. Everything persists on disk, so any session can pick up where another left off.",
  ];
  if (live.length === 0) out.push("No features in flight.");
  for (const f of live) {
    out.push(
      "",
      `## ${f.name} (${f.lifecycle}, ${f.roadmap})`,
      f.checkpoint.summary,
      `next: ${f.checkpoint.next.join(", ") || "—"}`,
    );
    if (f.checkpoint.note) out.push(`note: ${f.checkpoint.note}`);
  }
  const due = dueClaims(domains, indexCode());
  if (due.length > 0) {
    out.push(
      "",
      `${due.length} claims have evidence that changed since they were verified (pnpm journal drift); they must be re-verified before the next commit (pnpm journal gate).`,
    );
  }
  out.push(
    "",
    "/remember <feature> loads a feature with its context; `pnpm journal claims <file>` shows the truth tied to a file.",
  );
  if (failing)
    out.push(
      "",
      "WARNING: `pnpm journal check` is failing. Run /journal-validate before relying on journal context.",
    );
  return out.join("\n");
};

// @claim infra/session-hook infra/handoff
const commandBrief = function (hook: string | null, failing: boolean) {
  const role = sessionRole();
  let text: string;
  if (role.kind === "worker") text = workerBrief(role.task, role.root);
  else if (role.kind === "orchestrator") {
    const { domains, features } = loadAll();
    const feature = features.find(function (f) {
      return f.name === role.feature;
    });
    text = feature
      ? `You are the orchestrator of this tmux session (/orchestrate ${role.feature}). Workers keep running across your sessions; \`pnpm orchestra status\`, then keep \`pnpm orchestra watch\` armed (Claude Code: the Monitor tool on \`./node_modules/.bin/deno run -A tooling/orchestra.ts watch --follow\`).\n\n${renderHandoff(feature, domains)}`
      : sessionBrief(failing);
  } else text = sessionBrief(failing);
  if (hook === "claude" || hook === "gemini") {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: text,
        },
      }),
    );
  } else if (hook === "cursor") {
    console.log(JSON.stringify({ additional_context: text }));
  } else {
    console.log(text);
  }
};

// @claim infra/workspace-tools
const SUBCOMMANDS: Record<
  string,
  { schema: CliSchema; run: (parsed: Parsed) => void }
> = {
  check: {
    schema: {
      description:
        "check: validate the journal and the code links; fails on errors and counts claims to re-verify.",
      options: {},
    },
    run: function () {
      commandCheck();
    },
  },
  build: {
    schema: {
      description:
        "build: regenerate _index.md, roadmap/ROADMAP.md and the AGENTS.md block.",
      options: {},
    },
    run: function () {
      commandBuild();
    },
  },
  drift: {
    schema: {
      description:
        "drift: claims whose evidence changed since they were stamped, stale roadmap items and attribution coverage.",
      options: {
        files: {
          type: "boolean",
          description: "list code files no claim is tied to",
        },
      },
    },
    run: function (parsed) {
      commandDrift(parsed.values.files === true);
    },
  },
  gate: {
    schema: {
      description:
        "gate: fail unless every claim is fresh; run it before committing.",
      options: {},
    },
    run: function () {
      commandGate();
    },
  },
  stamp: {
    schema: {
      description:
        "stamp <domain>[/<claim>]: regenerate claim sources from @claim links, rehash them and date the claims.",
      options: {
        all: {
          type: "boolean",
          description: "stamp every claim in every domain",
        },
      },
    },
    run: function (parsed) {
      commandStamp(parsed.positionals[0], parsed.values.all === true);
    },
  },
  claims: {
    schema: {
      description:
        "claims <path>..: the claims tied to each file through links, scopes and cited sources.",
      options: {},
    },
    run: function (parsed) {
      commandClaims(parsed.positionals);
    },
  },
  set: {
    schema: {
      description: `set <feature> <item> <state>: write a plan item state (${PLAN_ITEM_STATES.join("|")}) and its refs.`,
      options: {
        ref: {
          type: "string",
          multiple: true,
          description: "<path>[=<role>], repeatable",
        },
      },
    },
    run: function (parsed) {
      const refs = parsed.values.ref;
      commandSet(
        parsed.positionals,
        Array.isArray(refs) ? refs.map(String) : [],
      );
    },
  },
  checkpoint: {
    schema: {
      description:
        "checkpoint <feature>: rewrite the checkpoint in the plan frontmatter.",
      options: {
        summary: {
          type: "string",
          description: "what just happened and what is next",
        },
        next: { type: "string", description: "item ids, comma separated" },
        blockers: { type: "string", description: "blockers, separated by |" },
        note: { type: "string", description: "the note for the next session" },
        "clear-note": { type: "boolean", description: "empty the note" },
      },
    },
    run: function (parsed) {
      commandCheckpoint(parsed.positionals[0], parsed.values);
    },
  },
  handoff: {
    schema: {
      description:
        "handoff <feature>: render the handoff for a feature from what is on disk.",
      options: {},
    },
    run: function (parsed) {
      commandHandoff(parsed.positionals[0]);
    },
  },
  brief: {
    schema: {
      description:
        "brief: session context for hooks (worker window, orchestrator pane or plain session).",
      options: {
        hook: {
          type: "string",
          description: "claude | gemini | cursor output format",
        },
        failing: {
          type: "boolean",
          description: "add the check-is-failing warning",
        },
      },
    },
    run: function (parsed) {
      const hook = parsed.values.hook;
      commandBrief(
        typeof hook === "string" ? hook : null,
        parsed.values.failing === true,
      );
    },
  },
};

const [command, ...rest] = process.argv.slice(2);
const subcommand = command ? SUBCOMMANDS[command] : undefined;
if (!subcommand) {
  console.log(USAGE);
  process.exit(!command || command === "-h" || command === "--help" ? 0 : 1);
}
const parsed = Cli.parseCli<Values>(
  `journal ${command}`,
  subcommand.schema,
  rest,
);
if (parsed === null)
  process.exit(rest.includes("--help") || rest.includes("-h") ? 0 : 1);
subcommand.run(parsed);
