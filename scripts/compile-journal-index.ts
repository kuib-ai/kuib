#!/usr/bin/env pnpm dlx tsx

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = join(__dirname, "..", "journal");
const INDEX_PATH = join(JOURNAL_DIR, "_index.md");
const CHECK_ONLY = process.argv.includes("--check");

type JournalLayer =
  | "product"
  | "experience"
  | "architecture"
  | "protocol"
  | "process"
  | "deferred"
  | "research"
  | "meta"
  | "reference";

interface EntryMeta {
  title: string;
  type: "vision" | "implementation" | "research" | "reference";
  layer: JournalLayer;
  status: string;
  created: string;
  tags: string[];
  dependsOn: string[];
  informs: string[];
  children: string[];
  bodyWikilinks: string[];
  dir: string;
}

interface ValidationIssue {
  level: "error" | "warning";
  entry: string;
  message: string;
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const lines = match[1].split("\n");
  const result: Record<string, unknown> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawValue] = kvMatch;
    let value: unknown = rawValue.trim();

    if (
      value === "" &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("[")
    ) {
      let depth = 0;
      const parts: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        parts.push(lines[j]);
        for (const ch of lines[j]) {
          if (ch === "[") depth++;
          if (ch === "]") depth--;
        }
        if (depth === 0) {
          value = parts.join(" ").replace(/\s+/g, " ").trim();
          i = j;
          break;
        }
      }
    }

    if (typeof value === "string" && value.startsWith("[")) {
      try {
        value = JSON.parse(value.replace(/'/g, '"'));
      } catch {
        value = value
          .slice(1, -1)
          .split(",")
          .map((s: string) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    }

    if (typeof value === "string") {
      value = value.replace(/^["']|["']$/g, "");
    }

    result[key] = value;
  }

  return result;
}

function extractWikilinks(content: string): string[] {
  const body = content.replace(/^---[\s\S]*?---/, "");
  const matches = body.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map((m) => m.slice(2, -2));
}

function extractDescription(content: string): string {
  const body = content.replace(/^---[\s\S]*?---/, "").trim();
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("<!--") &&
      !trimmed.startsWith("```") &&
      !trimmed.startsWith("|") &&
      !trimmed.startsWith("- ") &&
      !trimmed.startsWith("* ") &&
      !trimmed.startsWith("1.") &&
      !trimmed.startsWith("**") &&
      !trimmed.startsWith(">")
    ) {
      return trimmed.length > 120 ? trimmed.slice(0, 120) + "..." : trimmed;
    }
  }
  return "(no description)";
}

function listChildren(dir: string, entryName: string): string[] {
  const children: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile() && entry.endsWith(".md") && entry !== "decisions.md") {
      children.push(`${entryName}/${entry.replace(".md", "")}`);
    }

    if (stat.isDirectory() && entry === "research") {
      const researchFiles = readdirSync(fullPath).filter((f) =>
        f.endsWith(".md"),
      );
      for (const rf of researchFiles) {
        children.push(`${entryName}/research/${rf.replace(".md", "")}`);
      }
    }
  }

  return children;
}

const LAYER_ORDER: JournalLayer[] = [
  "product",
  "experience",
  "architecture",
  "protocol",
  "process",
  "deferred",
  "research",
  "meta",
  "reference",
];

const LAYER_LABELS: Record<JournalLayer, string> = {
  product: "Product",
  experience: "Experience",
  architecture: "Architecture",
  protocol: "Protocol",
  process: "Process",
  deferred: "Deferred",
  research: "Research",
  meta: "Meta",
  reference: "Reference",
};

const TYPE_TO_LAYER: Record<EntryMeta["type"], JournalLayer> = {
  vision: "product",
  implementation: "architecture",
  research: "research",
  reference: "reference",
};

function resolveLayer(
  rawLayer: unknown,
  type: EntryMeta["type"],
): JournalLayer {
  if (
    typeof rawLayer === "string" &&
    LAYER_ORDER.includes(rawLayer as JournalLayer)
  ) {
    return rawLayer as JournalLayer;
  }
  return TYPE_TO_LAYER[type] || "architecture";
}

function main() {
  const issues: ValidationIssue[] = [];
  const entries: Map<string, EntryMeta> = new Map();

  if (!existsSync(JOURNAL_DIR)) {
    console.error("journal/ directory not found");
    process.exit(1);
  }

  const dirs = readdirSync(JOURNAL_DIR).filter((d) => {
    const full = join(JOURNAL_DIR, d);
    return (
      statSync(full).isDirectory() && d !== "_templates" && !d.startsWith(".")
    );
  });

  for (const dir of dirs) {
    const decisionsPath = join(JOURNAL_DIR, dir, "decisions.md");

    if (!existsSync(decisionsPath)) {
      issues.push({
        level: "error",
        entry: dir,
        message: "Missing decisions.md",
      });
      continue;
    }

    const content = readFileSync(decisionsPath, "utf-8");
    const fm = parseFrontmatter(content);

    const title = (fm.title as string) || dir;
    const type = (fm.type as EntryMeta["type"]) || "implementation";
    const status = (fm.status as string) || "open";
    const created = (fm.created as string) || "unknown";
    const tags = (fm.tags as string[]) || [];
    const dependsOn = ((fm["depends-on"] as string[]) || []).map((s) =>
      s.replace(/^\[\[|\]\]$/g, ""),
    );
    const informs = ((fm.informs as string[]) || []).map((s) =>
      s.replace(/^\[\[|\]\]$/g, ""),
    );
    const layer = resolveLayer(fm.layer, type);

    if (!["vision", "implementation", "research", "reference"].includes(type)) {
      issues.push({
        level: "warning",
        entry: dir,
        message: `Invalid type "${type}". Must be vision|implementation|research|reference`,
      });
    }

    if (!fm.title) {
      issues.push({
        level: "warning",
        entry: dir,
        message: "Missing title in frontmatter",
      });
    }

    const children = listChildren(join(JOURNAL_DIR, dir), dir);
    const bodyWikilinks = extractWikilinks(content);

    entries.set(dir, {
      title,
      type,
      layer,
      status,
      created,
      tags,
      dependsOn,
      informs,
      children,
      bodyWikilinks,
      dir,
    });
  }

  const allEntryNames = new Set(entries.keys());

  for (const [name, entry] of entries) {
    for (const dep of entry.dependsOn) {
      const base = dep.split("/")[0];
      if (!allEntryNames.has(base)) {
        issues.push({
          level: "error",
          entry: name,
          message: `Broken depends-on link: [[${dep}]]`,
        });
      }
    }

    for (const inf of entry.informs) {
      const base = inf.split("/")[0];
      if (!allEntryNames.has(base)) {
        issues.push({
          level: "error",
          entry: name,
          message: `Broken informs link: [[${inf}]]`,
        });
      }
    }

    for (const link of entry.bodyWikilinks) {
      const base = link.split("/")[0];
      if (!allEntryNames.has(base)) {
        issues.push({
          level: "warning",
          entry: name,
          message: `Broken body wikilink: [[${link}]]`,
        });
      }
    }

    for (const dep of entry.dependsOn) {
      const base = dep.split("/")[0];
      const target = entries.get(base);
      if (target && !target.informs.some((i) => i.split("/")[0] === name)) {
        issues.push({
          level: "warning",
          entry: name,
          message: `${name} depends-on [[${dep}]] but ${base} doesn't list ${name} in informs`,
        });
      }
    }
  }

  if (issues.length > 0) {
    console.log("\n--- Validation Issues ---\n");
    for (const issue of issues) {
      const icon = issue.level === "error" ? "ERROR" : "WARN";
      console.log(`  [${icon}] ${issue.entry}: ${issue.message}`);
    }
    console.log(
      `\n  ${issues.filter((i) => i.level === "error").length} errors, ${issues.filter((i) => i.level === "warning").length} warnings\n`,
    );
  } else {
    console.log("\n  All checks passed.\n");
  }

  const groups = new Map<JournalLayer, EntryMeta[]>();
  for (const layer of LAYER_ORDER) {
    groups.set(layer, []);
  }

  for (const entry of entries.values()) {
    groups.get(entry.layer)!.push(entry);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.title.localeCompare(b.title));
  }

  let index = "# Journal Graph\n";

  for (const layer of LAYER_ORDER) {
    const groupEntries = groups.get(layer)!;
    if (groupEntries.length === 0) continue;

    index += `\n## ${LAYER_LABELS[layer]}\n`;

    for (const entry of groupEntries) {
      const tagsStr = entry.tags.join(",");
      index += `\n### [[${entry.dir}]] | status:${entry.status} | tags:${tagsStr}\n`;

      const decisionsPath = join(JOURNAL_DIR, entry.dir, "decisions.md");
      const content = readFileSync(decisionsPath, "utf-8");
      const desc = extractDescription(content);
      index += `  ${desc}\n`;

      for (const child of entry.children) {
        index += `  - [[${child}]]\n`;
      }
    }
  }

  if (CHECK_ONLY) {
    if (existsSync(INDEX_PATH)) {
      const current = readFileSync(INDEX_PATH, "utf-8");
      if (current.trim() !== index.trim()) {
        console.log("  Index is out of date. Run without --check to rebuild.");
        process.exit(1);
      } else {
        console.log("  Index is up to date.");
      }
    } else {
      console.log("  No index file found. Run without --check to create it.");
      process.exit(1);
    }
  } else {
    writeFileSync(INDEX_PATH, index);
    console.log(`  Index written to ${relative(process.cwd(), INDEX_PATH)}`);
    console.log(`  ${entries.size} entries indexed.`);
  }
}

main();
