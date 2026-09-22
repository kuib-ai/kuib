#!/usr/bin/env -S deno run -A
// Journal tooling. The contract it enforces is journal/SPEC.md.
//
//   check                 validate roadmap, domains, features, wireframes, archive, ownership
//   build                 regenerate _index.md, roadmap/ROADMAP.md, the AGENTS.md block
//   drift [--files]       rank claims by broken/changed anchors and commits since verified
//   stamp <domain>[#C###] rehash symbol anchors and set verified to HEAD
//   brief [--hook claude|gemini|cursor] [--failing]  features in flight, for session hooks
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "@std/toml";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JOURNAL = join(ROOT, "journal");
const DOMAINS = ["product", "core", "host", "infra"] as const;
const AGENTS_PATH = join(ROOT, "AGENTS.md");
const GENERATED_START = "<!-- journal:generated:start -->";
const GENERATED_END = "<!-- journal:generated:end -->";
const STALE_ITEM_DAYS = 60;

// ─── issues ──────────────────────────────────────────────────────────────────

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

// ─── fs + git helpers ────────────────────────────────────────────────────────

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

const git = function (...args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf-8" }).trim();
};

const gitOk = function (...args: string[]): string | null {
  try {
    return git(...args);
  } catch {
    return null;
  }
};

const rel = function (path: string): string {
  return relative(ROOT, path);
};

const jrel = function (path: string): string {
  return relative(JOURNAL, path).replace(/\.md$/, "");
};

// ─── markdown helpers ────────────────────────────────────────────────────────

type Frontmatter = Record<string, string | string[]>;

const splitList = function (inner: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ",") {
      items.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  items.push(current.trim());
  return items.filter(Boolean);
};

const unquote = function (value: string): string {
  const trimmed = value.trim();
  if (/^".*"$|^'.*'$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed.replace(/\s+#.*$/, "");
};

const parseFrontmatter = function (content: string): Frontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return null;
  const lines = match[1].split("\n");
  const result: Frontmatter = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    if (raw.startsWith("[")) {
      let text = raw;
      while (
        (text.match(/\[/g) ?? []).length > (text.match(/\]/g) ?? []).length &&
        i + 1 < lines.length
      ) {
        text += " " + lines[++i].trim();
      }
      const inner = text.slice(text.indexOf("[") + 1, text.lastIndexOf("]"));
      result[key] = splitList(inner);
      continue;
    }
    if (raw.trim() === "" || raw.trim().startsWith("#")) {
      const list: string[] = [];
      while (i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
        list.push(unquote(lines[++i].replace(/^\s+-\s/, "")));
      }
      result[key] = list.length > 0 ? list : "";
      continue;
    }
    result[key] = unquote(raw);
  }
  return result;
};

const str = function (fm: Frontmatter, key: string): string {
  const value = fm[key];
  return typeof value === "string" ? value : "";
};

const list = function (fm: Frontmatter, key: string): string[] {
  const value = fm[key];
  return Array.isArray(value) ? value : [];
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
    if (m && levels.includes(m[1].length)) out.push(m[2]);
  }
  return out;
};

const blockIds = function (content: string): Set<string> {
  const ids = new Set<string>();
  for (const line of stripFences(content)) {
    const m = line.match(/(?:^|\s)\^([A-Za-z0-9-]+)\s*$/);
    if (m) ids.add(m[1]);
  }
  return ids;
};

const wikilinks = function (text: string): string[] {
  return [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(
    function (m) {
      return m[1];
    },
  );
};

// Resolves a journal-relative wikilink target. Archive links are historical once
// the archive is gone, so they only resolve while it exists.
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

// ─── globs ───────────────────────────────────────────────────────────────────

const globToRegExp = function (glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
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

// ─── symbol hashing ──────────────────────────────────────────────────────────

const declarationName = function (node: ts.Node): string | null {
  const named = node as ts.Node & { name?: ts.Node };
  if (
    named.name &&
    (ts.isIdentifier(named.name) || ts.isStringLiteral(named.name))
  ) {
    return named.name.text;
  }
  return null;
};

const findNamed = function (root: ts.Node, name: string): ts.Node | null {
  let found: ts.Node | null = null;
  const visit = function (node: ts.Node) {
    if (found) return;
    if (node !== root && declarationName(node) === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(root, visit);
  return found;
};

const symbolHash = function (path: string, symbol: string): string | null {
  const full = join(ROOT, path);
  if (!existsSync(full)) return null;
  const source = ts.createSourceFile(
    path,
    read(full),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let node: ts.Node | null = source;
  for (const part of symbol.split(".")) {
    node = node ? findNamed(node, part) : null;
  }
  if (!node || node === source) return null;
  // Printed through the TS printer so formatting-only edits keep the same hash.
  const printer = ts.createPrinter({ removeComments: true });
  const text = printer
    .printNode(ts.EmitHint.Unspecified, node, source)
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(text).digest("hex").slice(0, 8);
};

// ─── domains ─────────────────────────────────────────────────────────────────

type Anchor =
  | { kind: "file"; path: string }
  | { kind: "symbol"; path: string; symbol: string; hash: string }
  | { kind: "quote"; path: string; quote: string }
  | { kind: "test"; path: string; name: string }
  | { kind: "url"; url: string };

interface Claim {
  domain: string;
  id: string;
  kind: string;
  verified: string;
  heading: string;
  anchors: Anchor[];
  links: string[];
  headerLine: number;
  anchorLines: number[];
}

interface Domain {
  name: string;
  summary: string;
  code: RegExp[];
  globs: string[];
  claims: Map<string, Claim>;
  decisions: Map<string, { title: string; status: string }>;
  currentPath: string;
}

const CLAIM_KINDS = ["behaviour", "structure", "rationale", "external"];
const CALLOUT_HEADER =
  /^> \[!sources\]-? (C\d{3}) · (\w+) · verified ([0-9a-f]{7,40}|pending)\s*$/;

// A quote matches verbatim, or with `\"` / `\\` escapes undone.
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
    return { kind: "test", path: m[1], name: m[2] };
  if ((m = line.match(/^> - url: <([^>]+)>\s*$/)))
    return { kind: "url", url: m[1] };
  if (/^> - (why|from): /.test(line)) return "link";
  if ((m = line.match(/^> - `([^`]+)` › `([^`]+)`(?: · #([0-9a-f]+))?\s*$/)))
    return { kind: "symbol", path: m[1], symbol: m[2], hash: m[3] ?? "" };
  if ((m = line.match(/^> - `([^`]+)` › "(.+)"\s*$/)))
    return { kind: "quote", path: m[1], quote: m[2] };
  if ((m = line.match(/^> - `([^`]+)`\s*$/)))
    return { kind: "file", path: m[1] };
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
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const h = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (h) heading = h[1];
    if (line.startsWith("> [!sources]")) {
      const prev = lines
        .slice(0, i)
        .reverse()
        .find(function (l) {
          return l.trim() !== "";
        });
      if (!prev || !/(?:^|\s)\^C\d{3}\s*$/.test(prev)) {
        report(
          "error",
          `${where}:${i + 1}`,
          "sources callout without a claim marker above it",
        );
      }
      continue;
    }
    const marker = line.match(/(?:^|\s)\^(C\d{3})\s*$/);
    if (!marker) continue;
    const id = marker[1];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    const header = lines[j]?.match(CALLOUT_HEADER);
    if (!header) {
      report(
        "error",
        `${where}:${i + 1}`,
        `claim ${id} has no valid sources callout below it`,
      );
      continue;
    }
    if (header[1] !== id) {
      report(
        "error",
        `${where}:${j + 1}`,
        `callout ${header[1]} does not match claim marker ${id}`,
      );
    }
    if (!CLAIM_KINDS.includes(header[2])) {
      report(
        "error",
        `${where}:${j + 1}`,
        `claim ${id} kind "${header[2]}" must be ${CLAIM_KINDS.join("|")}`,
      );
    }
    const claim: Claim = {
      domain,
      id,
      kind: header[2],
      verified: header[3],
      heading,
      anchors: [],
      links: [],
      headerLine: j,
      anchorLines: [],
    };
    for (j = j + 1; j < lines.length && lines[j].startsWith(">"); j++) {
      const anchor = parseAnchor(lines[j]);
      if (anchor === null) {
        report(
          "error",
          `${where}:${j + 1}`,
          `unrecognised source line in ${id}: ${lines[j]}`,
        );
      } else if (anchor === "link") {
        claim.links.push(...wikilinks(lines[j]));
      } else {
        claim.anchors.push(anchor);
        claim.anchorLines.push(j);
      }
    }
    if (claims.has(id)) report("error", where, `duplicate claim ${id}`);
    claims.set(id, claim);
    i = j - 1;
  }
  return claims;
};

const anchorPath = function (anchor: Anchor): string | null {
  return anchor.kind === "url" ? null : anchor.path;
};

// Returns a problem string when the anchor no longer holds.
const checkAnchor = function (anchor: Anchor): string | null {
  const path = anchorPath(anchor);
  if (path === null) return null;
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
  if (anchor.kind === "symbol") {
    if (!/\.tsx?$/.test(path))
      return `symbol anchors are TS-only (${path}); use a quote`;
    const hash = symbolHash(path, anchor.symbol);
    if (hash === null) return `symbol ${anchor.symbol} not found in ${path}`;
  }
  return null;
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
    const fm = parseFrontmatter(read(currentPath)) ?? {};
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
            `${m[1]} status must be accepted|superseded`,
          );
        }
        if (!ids.has(m[1])) {
          report(
            "error",
            `${where}/decisions.md`,
            `${m[1]} missing its ^${m[1]} block marker`,
          );
        }
        if (decisions.has(m[1]))
          report("error", `${where}/decisions.md`, `duplicate ${m[1]}`);
        decisions.set(m[1], { title: m[2], status });
      }
    } else {
      report("error", where, "missing decisions.md");
    }
    domains.set(name, {
      name,
      summary: str(fm, "summary"),
      globs,
      code: globs.map(globToRegExp),
      claims: parseClaims(name, currentPath),
      decisions,
      currentPath,
    });
  }
  return domains;
};

const validateDomains = function (domains: Map<string, Domain>) {
  for (const domain of domains.values()) {
    const where = rel(domain.currentPath);
    checkLinks(where, read(domain.currentPath));
    const decisionsPath = join(dirname(domain.currentPath), "decisions.md");
    if (existsSync(decisionsPath))
      checkLinks(rel(decisionsPath), read(decisionsPath));
    for (const claim of domain.claims.values()) {
      const at = `${where} ${claim.id}`;
      const code = claim.anchors.filter(function (a) {
        return a.kind !== "url";
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
        code.length === 0
      ) {
        report("error", at, "claim cites no code");
      }
      for (const anchor of claim.anchors) {
        const problem = checkAnchor(anchor);
        if (problem) report("error", at, problem);
      }
      if (
        claim.verified !== "pending" &&
        gitOk("cat-file", "-e", `${claim.verified}^{commit}`) === null
      ) {
        report("error", at, `verified ${claim.verified} is not a commit`);
      }
    }
  }
};

// ─── ownership + @context headers ────────────────────────────────────────────

const trackedFiles = function (): string[] {
  const out = gitOk("ls-files", "--cached", "--others", "--exclude-standard");
  return (out ?? "").split("\n").filter(function (f) {
    return f && !f.startsWith("journal/") && existsSync(join(ROOT, f));
  });
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

const CONTEXT_HEADER = /^\/\/ @context\s+@journal\/(\S+)/m;

const validateOwnership = function (domains: Map<string, Domain>) {
  if (domains.size === 0) return;
  for (const file of trackedFiles()) {
    const owners = ownerOf(domains, file);
    if (owners.length === 0)
      report("error", file, "no domain owns this file (add a code glob)");
    if (owners.length > 1)
      report("error", file, `owned by several domains: ${owners.join(", ")}`);
    if (!/^(apps|packages)\/.*\.tsx?$/.test(file) || /\.d\.ts$/.test(file))
      continue;
    const header = read(join(ROOT, file)).slice(0, 600).match(CONTEXT_HEADER);
    if (!header) continue;
    const m = header[1].match(/^domains\/(\w+)(?:#\^(C\d{3}))?$/);
    if (!m) {
      report(
        "error",
        file,
        `@context must point at @journal/domains/<domain>[#^C###], got ${header[1]}`,
      );
      continue;
    }
    if (owners.length === 1 && m[1] !== owners[0]) {
      report(
        "error",
        file,
        `@context names ${m[1]} but ${owners[0]} owns this file`,
      );
    }
    if (m[2] && !domains.get(m[1])?.claims.has(m[2])) {
      report("error", file, `@context claim ${m[1]}#${m[2]} does not exist`);
    }
  }
};

// ─── roadmap ─────────────────────────────────────────────────────────────────

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
    const fm = parseFrontmatter(content);
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
      slug: m[2],
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
    if (item.id !== m[1])
      report("error", where, `id ${item.id} must match filename ${m[1]}`);
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

// ─── features ────────────────────────────────────────────────────────────────

interface Feature {
  name: string;
  lifecycle: string;
  summary: string;
  roadmap: string;
  state: string;
  checkpoint: string;
  next: string[];
  context: string[];
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
];
const LIFECYCLES = [
  "draft",
  "accepted",
  "implementing",
  "shipped",
  "abandoned",
  "superseded",
];
const ITEM_STATES_IMPL = [
  "planned",
  "in_progress",
  "implemented",
  "verified",
  "deferred",
  "dropped",
];
const TERMINAL = ["deferred", "dropped"];

const TASK_STATUSES = ["draft", "running", "done", "blocked", "failed", "lost"];
const seenTasks = new Map<string, string>();

// Orchestra task records: journal/features/<feature>/tasks/<task-id>/ (see SPEC → Tasks).
const validateTasks = function (feature: string) {
  const root = join(JOURNAL, "features", feature, "tasks");
  for (const id of listDirs(root)) {
    const dir = join(root, id);
    const where = `journal/features/${feature}/tasks/${id}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      report("error", where, "task id must be kebab-case");
    }
    const other = seenTasks.get(id);
    if (other) report("error", where, `task id also used in feature ${other}`);
    seenTasks.set(id, feature);
    const tomlPath = join(dir, "task.toml");
    if (!existsSync(tomlPath)) {
      report("error", where, "missing task.toml");
      continue;
    }
    let task: Record<string, unknown>;
    try {
      task = parseToml(read(tomlPath)) as Record<string, unknown>;
    } catch (error) {
      report(
        "error",
        `${where}/task.toml`,
        `invalid TOML: ${(error as Error).message}`,
      );
      continue;
    }
    const status = String(task.status ?? "");
    if (!TASK_STATUSES.includes(status)) {
      report(
        "error",
        `${where}/task.toml`,
        `status must be ${TASK_STATUSES.join("|")}`,
      );
    }
    if (status !== "draft" && !existsSync(join(dir, "brief.md"))) {
      report("error", where, `status ${status} needs brief.md`);
    }
    if (
      ["done", "blocked", "failed"].includes(status) &&
      !existsSync(join(dir, "report.md"))
    ) {
      report("error", where, `status ${status} needs report.md`);
    }
  }
};

const loadFeatures = function (items: Map<string, Item>): Feature[] {
  const features: Feature[] = [];
  for (const name of listDirs(join(JOURNAL, "features"))) {
    const dir = join(JOURNAL, "features", name);
    const where = `journal/features/${name}`;
    const planPath = join(dir, "plan.md");
    const implPath = join(dir, "implementation.toml");
    if (!existsSync(planPath) || !existsSync(implPath)) {
      report("error", where, "needs plan.md and implementation.toml");
      continue;
    }
    const plan = read(planPath);
    const fm = parseFrontmatter(plan) ?? {};
    for (const key of Object.keys(fm)) {
      if (!PLAN_KEYS.includes(key))
        report("error", `${where}/plan.md`, `unknown frontmatter key "${key}"`);
    }
    for (const key of ["owner", "lifecycle", "summary", "roadmap"]) {
      if (!str(fm, key)) report("error", `${where}/plan.md`, `missing ${key}`);
    }
    const lifecycle = str(fm, "lifecycle");
    if (!LIFECYCLES.includes(lifecycle)) {
      report(
        "error",
        `${where}/plan.md`,
        `lifecycle must be ${LIFECYCLES.join("|")}`,
      );
    }
    const roadmap = str(fm, "roadmap");
    const item = items.get(roadmap);
    if (roadmap && !item)
      report("error", `${where}/plan.md`, `roadmap ${roadmap} does not exist`);
    if (item && item.feature !== name) {
      report(
        "error",
        `${where}/plan.md`,
        `roadmap ${roadmap} does not point back (feature: "${item.feature}")`,
      );
    }
    for (const link of list(fm, "context").flatMap(wikilinks)) {
      const problem = resolveLink(link);
      if (problem)
        report(
          "error",
          `${where}/plan.md`,
          `broken context [[${link}]]: ${problem}`,
        );
    }

    const body = stripFences(plan).join("\n");
    const planItems = [...body.matchAll(/^### (P\d{2}-I\d{2}) — /gm)].map(
      function (m) {
        return m[1];
      },
    );
    const planPhases = [...body.matchAll(/^## (P\d{2}) — /gm)].map(
      function (m) {
        return m[1];
      },
    );
    const planDecisions = new Set(
      [...body.matchAll(/^### (D\d{3}) — /gm)].map(function (m) {
        return m[1];
      }),
    );
    const planGaps = new Set(
      [...body.matchAll(/^### (G\d{3}) — /gm)].map(function (m) {
        return m[1];
      }),
    );

    let impl: Record<string, unknown>;
    try {
      impl = parseToml(read(implPath)) as Record<string, unknown>;
    } catch (error) {
      report(
        "error",
        `${where}/implementation.toml`,
        `invalid TOML: ${(error as Error).message}`,
      );
      continue;
    }
    const at = `${where}/implementation.toml`;
    const implItems = (impl.items ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const implPhases = (impl.phases ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const checkpoint = (impl.checkpoint ?? {}) as Record<string, unknown>;
    if (impl.feature !== name) report("error", at, `feature must be "${name}"`);
    for (const id of planItems) {
      if (!implItems[id])
        report("error", at, `plan item ${id} has no implementation entry`);
    }
    for (const [id, entry] of Object.entries(implItems)) {
      if (!planItems.includes(id))
        report("error", at, `${id} is not in plan.md`);
      if (!ITEM_STATES_IMPL.includes(entry.state as string))
        report("error", at, `${id} state is invalid`);
      for (const d of (entry.decisions ?? []) as string[]) {
        if (!planDecisions.has(d))
          report("error", at, `${id} references unknown decision ${d}`);
      }
      for (const g of (entry.addresses ?? []) as string[]) {
        if (!planGaps.has(g))
          report("error", at, `${id} addresses unknown gap ${g}`);
      }
      for (const ref of (entry.refs ?? []) as unknown[]) {
        const path = (ref as { path?: unknown })?.path;
        if (typeof path !== "string") {
          report(
            "error",
            at,
            `${id} ref must be { path, role }, got ${JSON.stringify(ref)}`,
          );
        } else if (!existsSync(join(ROOT, path))) {
          report("error", at, `${id} ref missing: ${path}`);
        }
      }
    }
    for (const phase of planPhases) {
      const states = planItems
        .filter(function (id) {
          return id.startsWith(`${phase}-`);
        })
        .map(function (id) {
          return (implItems[id]?.state as string) ?? "planned";
        });
      const expected = states.every(function (s) {
        return s === "planned";
      })
        ? "planned"
        : states.every(function (s) {
              return ["implemented", "verified", ...TERMINAL].includes(s);
            })
          ? "implemented"
          : "in_progress";
      const actual = implPhases[phase]?.state;
      if (actual !== expected)
        report(
          "error",
          at,
          `phase ${phase} state is ${actual}, items imply ${expected}`,
        );
    }
    const next = (checkpoint.next ?? []) as string[];
    for (const id of next) {
      const state = implItems[id]?.state as string | undefined;
      if (!state) report("error", at, `checkpoint next ${id} does not exist`);
      else if (TERMINAL.includes(state))
        report("error", at, `checkpoint next ${id} is terminal`);
    }
    validateTasks(name);
    features.push({
      name,
      lifecycle,
      summary: str(fm, "summary"),
      roadmap,
      state: String(impl.state ?? ""),
      checkpoint: String(checkpoint.summary ?? ""),
      next,
      context: list(fm, "context").flatMap(wikilinks),
    });
  }
  return features;
};

// ─── wireframes ──────────────────────────────────────────────────────────────

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
      const fm = parseFrontmatter(read(path)) ?? {};
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

// ─── archive ─────────────────────────────────────────────────────────────────

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
  const claim = target.match(/^(\w+)#(C\d{3})$/);
  if (claim)
    return domains.get(claim[1])?.claims.has(claim[2])
      ? null
      : `unknown claim ${target}`;
  const decision = target.match(/^(\w+)#(D\d{3})$/);
  if (decision) {
    return domains.get(decision[1])?.decisions.has(decision[2])
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
      const file = relative(dir, path);
      units.set(file, new Set(headings(read(path), [2, 3])));
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

// ─── generation ──────────────────────────────────────────────────────────────

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
    "# Roadmap\n\n<!-- Generated by scripts/journal.ts build. Do not edit. -->\n";
  out +=
    "\nEverything not built yet. Items: `roadmap/items/`. Unsorted ideas: [[roadmap/inbox]].\n";
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
    out += `\n## ${horizon[0].toUpperCase()}${horizon.slice(1)}\n\n`;
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
    "# Journal\n\n<!-- Generated by scripts/journal.ts build. Do not edit. -->\n";
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
    if (f.lifecycle === "implementing" && f.next.length > 0) {
      out += `  next: ${f.next.join(", ")}\n`;
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
  let out = `${GENERATED_START}\n<!-- Generated by scripts/journal.ts build. Do not edit. -->\n`;
  out += "\n### Code map\n\n| Path | Domain | Description |\n|---|---|---|\n";
  const projects = ["apps", "packages", "services"].flatMap(function (group) {
    return listDirs(join(ROOT, group)).map(function (name) {
      return `${group}/${name}`;
    });
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

// ─── commands ────────────────────────────────────────────────────────────────

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

const commandCheck = function () {
  const state = loadAll();
  validateDomains(state.domains);
  validateItems(state.items);
  validateOwnership(state.domains);
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
  if (printIssues() > 0) process.exit(1);
};

const commandBuild = function () {
  const state = loadAll();
  const { files } = outputs(state);
  for (const [path, content] of files) {
    writeFileSync(path, content.endsWith("\n") ? content : content + "\n");
    console.log(`  wrote ${rel(path)}`);
  }
  printIssues();
};

interface DriftRow {
  target: string;
  heading: string;
  status: "broken" | "changed" | "dirty" | "unverified" | "stale" | "fresh";
  detail: string;
  commits: number;
}

const commandDrift = function (showFiles: boolean) {
  const { domains, items } = loadAll();
  const rows: DriftRow[] = [];
  const dirty = new Set(
    (gitOk("status", "--porcelain") ?? "")
      .split("\n")
      .filter(Boolean)
      .map(function (l) {
        return l.slice(3).split(" -> ").pop()!;
      }),
  );
  for (const domain of domains.values()) {
    for (const claim of domain.claims.values()) {
      const target = `${domain.name}#${claim.id}`;
      const paths = [
        ...new Set(claim.anchors.map(anchorPath).filter(Boolean)),
      ] as string[];
      const problems = claim.anchors
        .map(checkAnchor)
        .filter(Boolean) as string[];
      const changed = claim.anchors.filter(function (a) {
        return (
          a.kind === "symbol" &&
          a.hash &&
          symbolHash(a.path, a.symbol) !== a.hash
        );
      }) as Extract<Anchor, { kind: "symbol" }>[];
      let commits = 0;
      if (claim.verified !== "pending" && paths.length > 0) {
        commits = Number(
          gitOk(
            "rev-list",
            "--count",
            `${claim.verified}..HEAD`,
            "--",
            ...paths,
          ) ?? 0,
        );
      }
      const dirtyPaths = paths.filter(function (p) {
        return dirty.has(p);
      });
      let row: DriftRow;
      if (problems.length > 0)
        row = {
          target,
          heading: claim.heading,
          status: "broken",
          detail: problems.join("; "),
          commits,
        };
      else if (changed.length > 0)
        row = {
          target,
          heading: claim.heading,
          status: "changed",
          detail: changed
            .map(function (a) {
              return `${a.path} › ${a.symbol}`;
            })
            .join(", "),
          commits,
        };
      else if (claim.verified === "pending")
        row = {
          target,
          heading: claim.heading,
          status: "unverified",
          detail: "never stamped",
          commits,
        };
      else if (commits > 0)
        row = {
          target,
          heading: claim.heading,
          status: "stale",
          detail: `${commits} commits since ${claim.verified}`,
          commits,
        };
      else if (dirtyPaths.length > 0)
        row = {
          target,
          heading: claim.heading,
          status: "dirty",
          detail: `uncommitted: ${dirtyPaths.join(", ")}`,
          commits,
        };
      else
        row = {
          target,
          heading: claim.heading,
          status: "fresh",
          detail: "",
          commits,
        };
      rows.push(row);
    }
  }
  const order = ["broken", "changed", "unverified", "stale", "dirty", "fresh"];
  rows.sort(function (a, b) {
    return (
      order.indexOf(a.status) - order.indexOf(b.status) || b.commits - a.commits
    );
  });
  console.log("\n## Claims\n");
  for (const row of rows) {
    if (row.status === "fresh") continue;
    console.log(
      `  ${row.status.padEnd(10)} ${row.target.padEnd(14)} ${row.heading}${row.detail ? ` — ${row.detail}` : ""}`,
    );
  }
  const fresh = rows.filter(function (r) {
    return r.status === "fresh";
  }).length;
  console.log(`\n  ${fresh}/${rows.length} claims fresh`);

  const today = Date.now();
  const staleItems = [...items.values()].filter(function (i) {
    return (
      ACTIVE_STATES.includes(i.state) &&
      (today - Date.parse(i.touched)) / 86_400_000 > STALE_ITEM_DAYS
    );
  });
  console.log(`\n## Roadmap items untouched for ${STALE_ITEM_DAYS}+ days\n`);
  for (const item of staleItems)
    console.log(`  ${item.id} ${item.title} (touched ${item.touched})`);
  if (staleItems.length === 0) console.log("  none");

  const cited = new Set<string>();
  for (const d of domains.values()) {
    for (const c of d.claims.values()) {
      for (const a of c.anchors) {
        const p = anchorPath(a);
        if (p) cited.add(p);
      }
    }
  }
  console.log(
    "\n## Attribution coverage (source files cited by at least one claim)\n",
  );
  const sources = trackedFiles().filter(function (f) {
    return /\.(tsx?|swift|py)$/.test(f) && !/\.test\.tsx?$|\.d\.ts$/.test(f);
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

const commandStamp = function (target: string | undefined) {
  if (!target) {
    console.error("usage: journal.ts stamp <domain>[#C###]");
    process.exit(1);
  }
  const [domainName, claimId] = target.split("#");
  const { domains } = loadAll();
  const domain = domains.get(domainName);
  if (!domain) {
    console.error(`unknown domain ${domainName}`);
    process.exit(1);
  }
  const head = git("rev-parse", "--short", "HEAD");
  const lines = read(domain.currentPath).split("\n");
  let stamped = 0;
  for (const claim of domain.claims.values()) {
    if (claimId && claim.id !== claimId) continue;
    const problems = claim.anchors.map(checkAnchor).filter(Boolean);
    if (problems.length > 0) {
      console.log(`  skip ${claim.id}: ${problems.join("; ")}`);
      continue;
    }
    claim.anchors.forEach(function (anchor, index) {
      if (anchor.kind !== "symbol") return;
      const hash = symbolHash(anchor.path, anchor.symbol)!;
      lines[claim.anchorLines[index]] =
        `> - \`${anchor.path}\` › \`${anchor.symbol}\` · #${hash}`;
    });
    lines[claim.headerLine] = lines[claim.headerLine].replace(
      /verified \S+\s*$/,
      `verified ${head}`,
    );
    stamped++;
  }
  writeFileSync(domain.currentPath, lines.join("\n"));
  console.log(
    `  stamped ${stamped} claim(s) in ${rel(domain.currentPath)} at ${head}`,
  );
  if (claimId && stamped === 0) process.exit(1);
};

// Short orientation for session hooks: features in flight with their checkpoints.
const commandBrief = function (hook: string | undefined, failing: boolean) {
  const { features } = loadAll();
  const live = features.filter(function (f) {
    return ["accepted", "implementing"].includes(f.lifecycle);
  });
  let text =
    "Journal: roadmap = intent, domains = built truth, features = in flight (journal/SPEC.md).";
  if (live.length === 0) text += " No features in flight.";
  for (const f of live) {
    text += `\n\n## ${f.name} (${f.lifecycle}, ${f.roadmap})\n${f.checkpoint}\nnext: ${f.next.join(", ") || "—"}`;
    if (f.context.length > 0) text += `\ncontext: ${f.context.join(", ")}`;
  }
  text +=
    "\n\nRun /remember <feature> to load a feature's plan and context before continuing its work.";
  if (failing) {
    text +=
      "\n\nWARNING: `pnpm journal check` is failing. Run /journal-validate before relying on journal context.";
  }
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

const [command, ...args] = process.argv.slice(2);
if (command === "check") commandCheck();
else if (command === "brief")
  commandBrief(
    args.includes("--hook") ? args[args.indexOf("--hook") + 1] : undefined,
    args.includes("--failing"),
  );
else if (command === "build") commandBuild();
else if (command === "drift") commandDrift(args.includes("--files"));
else if (command === "stamp") commandStamp(args[0]);
else {
  console.error(
    "usage: journal.ts check | build | brief [--hook claude|gemini|cursor] [--failing] | drift [--files] | stamp <domain>[#C###]",
  );
  process.exit(1);
}
