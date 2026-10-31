import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import mergeTestCoverage from "./index.ts";

describe("mergeTestCoverage", function () {
  it("unions measured lines and branches across runs without counting a source twice", function () {
    using first = createTempDir();
    using second = createTempDir();
    writeFileSync(
      join(first.path, "lcov.info"),
      "SF:/project/src/unit.ts\nFN:1,run\nFNDA:2,run\nFNF:1\nFNH:1\nDA:1,2\nDA:2,0\nLF:2\nLH:1\nBRDA:2,0,0,2\nBRDA:2,0,1,-\nBRF:2\nBRH:1\nend_of_record\n",
    );
    writeFileSync(
      join(second.path, "lcov.info"),
      "SF:/project/src/unit.ts\nFN:1,run\nFNDA:1,run\nFNF:1\nFNH:1\nDA:1,1\nDA:2,1\nLF:2\nLH:2\nBRDA:2,0,0,0\nBRDA:2,0,1,1\nBRF:2\nBRH:1\nend_of_record\n",
    );
    const merged = mergeTestCoverage([first.path, second.path], "/project/src");
    expect(merged.match(/^SF:/gm)?.length).toBe(1);
    expect(merged).toContain("DA:1,3\nDA:2,1\nLF:2\nLH:2\n");
    expect(merged).toContain("FNDA:3,run\nFNF:1\nFNH:1\n");
    expect(merged).toContain("BRDA:2,0,0,2\nBRDA:2,0,1,1\nBRF:2\nBRH:2\n");
  });

  it("includes only owned production sources, excluding tests, benchmarks and similar prefixes", function () {
    using profile = createTempDir();
    const sources = [
      "/project/src/unit.ts",
      "/project/src/unit.test.ts",
      "/project/src/unit.live.test.ts",
      "/project/src/unit.bench.ts",
      "/project/src.other/unit.ts",
      "/other/unit.ts",
    ];
    writeFileSync(
      join(profile.path, "lcov.info"),
      sources
        .map(function (source) {
          return `SF:${source}\nDA:1,1\nLF:1\nLH:1\nend_of_record\n`;
        })
        .join(""),
    );
    const merged = mergeTestCoverage([profile.path], "/project/src");
    expect(merged.match(/^SF:(.+)$/gm)).toEqual(["SF:/project/src/unit.ts"]);
  });

  it("fails when a collected run has no lcov report", function () {
    using profile = createTempDir();
    expect(function () {
      return mergeTestCoverage([profile.path], "/project/src");
    }).toThrow();
  });
});
