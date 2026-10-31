// @claim infra/coverage-report
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import mergeTestCoverage from "../merge.test.coverage/index.ts";
import resolveTestProjects from "../resolve.test.projects/index.ts";
import resolveTestTargets from "../resolve.test.targets/index.ts";

type Tally = { lines: number; linesHit: number; branches: number; hit: number };
type CoverageReportInput = { workspaceRoot: string; coverageRoot: string };

const tally = function (lcov: string): Tally {
  const sum = function (key: string): number {
    const pattern = new RegExp(`^${key}:(\\d+)$`, "gm");
    return [...lcov.matchAll(pattern)].reduce(function (total, match) {
      return total + Number(match[1]);
    }, 0);
  };
  return {
    lines: sum("LF"),
    linesHit: sum("LH"),
    branches: sum("BRF"),
    hit: sum("BRH"),
  };
};

const percent = function (hit: number, total: number): string {
  return total === 0 ? "—" : `${((hit / total) * 100).toFixed(1)}%`;
};

// @claim infra/coverage-report
const reportTestCoverage = function (input: CoverageReportInput): void {
  const { workspaceRoot, coverageRoot } = input;
  const raw = join(coverageRoot, "raw");
  const rows: [string, Tally][] = [];
  const reports: string[] = [];
  const html = join(coverageRoot, "html");
  mkdirSync(html, { recursive: true });
  let lcov = "";
  const available = readdirSync(raw).map(function (path) {
    return join(raw, path);
  });
  const projects = resolveTestProjects(workspaceRoot);
  const targets = resolveTestTargets(workspaceRoot, projects, workspaceRoot);
  for (const target of targets) {
    const { project, name } = target;
    const folder = name.replace(/^@[^/]+\//, "");
    const source = existsSync(join(project, "src"))
      ? join(project, "src")
      : project;
    const profiles = available.filter(function (profile) {
      const content = readFileSync(join(profile, "lcov.info"), "utf8");
      return content.includes(`SF:${source}/`);
    });
    if (profiles.length === 0) {
      if (available.includes(join(raw, folder))) {
        throw new Error(`coverage recorded no production sources for ${name}`);
      }
      continue;
    }
    const owned = mergeTestCoverage(profiles, source);
    const counts = tally(owned);
    if (counts.lines === 0) {
      throw new Error(`coverage recorded no production sources for ${name}`);
    }
    writeFileSync(join(coverageRoot, `${folder}.lcov`), owned);
    lcov += owned;
    const links: string[] = [];
    for (const [index, profile] of profiles.entries()) {
      cpSync(join(profile, "html"), join(html, folder, String(index)), {
        recursive: true,
      });
      links.push(`<li><a href="${index}/index.html">Run ${index + 1}</a></li>`);
    }
    writeFileSync(
      join(html, folder, "index.html"),
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>${name} coverage</title><h1>${name} coverage</h1><p>Lines ${percent(counts.linesHit, counts.lines)}; branches ${percent(counts.hit, counts.branches)}</p><ul>${links.join("")}</ul></html>`,
    );
    reports.push(
      `<tr><td><a href="${folder}/index.html">${name}</a></td><td>${percent(counts.linesHit, counts.lines)}</td><td>${percent(counts.hit, counts.branches)}</td></tr>`,
    );
    rows.push([name, counts]);
  }
  writeFileSync(join(coverageRoot, "total.lcov"), lcov);
  const total = tally(lcov);
  reports.push(
    `<tr><td>workspace total</td><td>${percent(total.linesHit, total.lines)}</td><td>${percent(total.hit, total.branches)}</td></tr>`,
  );
  writeFileSync(
    join(html, "index.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Workspace coverage</title><h1>Workspace coverage</h1><table><thead><tr><th>Project</th><th>Lines</th><th>Branches</th></tr></thead><tbody>${reports.join("")}</tbody></table></html>`,
  );
  rows.push(["workspace total", total]);
  const width = Math.max(
    ...rows.map(function ([name]) {
      return name.length;
    }),
  );
  console.log(`\n${"project".padEnd(width)}  ${"lines".padStart(7)}  branches`);
  for (const [name, counts] of rows) {
    const lines = percent(counts.linesHit, counts.lines).padStart(7);
    const branches = percent(counts.hit, counts.branches).padStart(8);
    console.log(`${name.padEnd(width)}  ${lines}  ${branches}`);
  }
  console.log(`\nwritten to ${relative(workspaceRoot, coverageRoot)}/`);
};

export default reportTestCoverage;
export type { CoverageReportInput };
