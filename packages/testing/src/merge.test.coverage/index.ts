// @claim infra/coverage-report
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TEST_FILE = /\.(test|bench)\.tsx?$/;

type CoverageRecord = {
  source: string;
  functions: Set<string>;
  functionHits: Map<string, number>;
  lines: Map<string, number>;
  branches: Map<string, number>;
};

// @claim infra/coverage-report
const mergeTestCoverage = function (
  profiles: string[],
  sourceRoot: string,
): string {
  const records = new Map<string, CoverageRecord>();
  for (const profile of profiles) {
    const content = readFileSync(join(profile, "lcov.info"), "utf8");
    for (const block of content.split("end_of_record")) {
      const source = /^SF:(.+)$/m.exec(block)?.[1];
      if (
        source === undefined ||
        !source.startsWith(`${sourceRoot}/`) ||
        TEST_FILE.test(source)
      ) {
        continue;
      }
      const record = records.get(source) ?? {
        source,
        functions: new Set<string>(),
        functionHits: new Map<string, number>(),
        lines: new Map<string, number>(),
        branches: new Map<string, number>(),
      };
      for (const line of block.split("\n")) {
        if (line.startsWith("FN:")) {
          record.functions.add(line);
          continue;
        }
        const match = /^(FNDA|DA|BRDA):(.+)$/.exec(line);
        if (match === null) {
          continue;
        }
        const fields = match[2]!.split(",");
        const branch = match[1] === "BRDA";
        const fn = match[1] === "FNDA";
        const key = branch
          ? fields.slice(0, 3).join(",")
          : fn
            ? fields.slice(1).join(",")
            : fields[0]!;
        const count = Number(
          branch
            ? fields[3] === "-"
              ? "0"
              : fields[3]
            : fn
              ? fields[0]
              : fields[1],
        );
        const values = branch
          ? record.branches
          : fn
            ? record.functionHits
            : record.lines;
        values.set(key, (values.get(key) ?? 0) + count);
      }
      records.set(source, record);
    }
  }
  return [...records.values()]
    .map(function (record) {
      const hit = function (values: Map<string, number>): number {
        return [...values.values()].filter(function (count) {
          return count > 0;
        }).length;
      };
      return [
        `SF:${record.source}`,
        ...record.functions,
        ...[...record.functionHits].map(function ([name, count]) {
          return `FNDA:${count},${name}`;
        }),
        `FNF:${record.functionHits.size}`,
        `FNH:${hit(record.functionHits)}`,
        ...[...record.lines].map(function ([line, count]) {
          return `DA:${line},${count}`;
        }),
        `LF:${record.lines.size}`,
        `LH:${hit(record.lines)}`,
        ...[...record.branches].map(function ([branch, count]) {
          return `BRDA:${branch},${count}`;
        }),
        `BRF:${record.branches.size}`,
        `BRH:${hit(record.branches)}`,
        "end_of_record",
        "",
      ].join("\n");
    })
    .join("");
};

export default mergeTestCoverage;
