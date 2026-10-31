import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import reportTestCoverage from "./index.ts";

describe("reportTestCoverage", function () {
  it("attributes one profile to its project and writes a workspace total", function () {
    using root = createTempDir();
    const project = join(root.path, "packages", "one");
    const coverage = join(root.path, "dist", "coverage");
    const profile = join(coverage, "raw", "one");
    mkdirSync(join(project, "src"), { recursive: true });
    mkdirSync(join(profile, "html"), { recursive: true });
    writeFileSync(join(project, "package.json"), '{"name":"@probe/one"}');
    writeFileSync(
      join(profile, "lcov.info"),
      `SF:${join(project, "src", "unit.ts")}\nDA:1,1\nLF:1\nLH:1\nend_of_record\n`,
    );
    writeFileSync(join(profile, "html", "index.html"), "profile");
    reportTestCoverage({ workspaceRoot: root.path, coverageRoot: coverage });
    expect(readFileSync(join(coverage, "one.lcov"), "utf8")).toContain(
      "LF:1\nLH:1",
    );
    expect(readFileSync(join(coverage, "total.lcov"), "utf8")).toContain(
      "unit.ts",
    );
    expect(existsSync(join(coverage, "html", "one", "0", "index.html"))).toBe(
      true,
    );
    expect(
      readFileSync(join(coverage, "html", "index.html"), "utf8"),
    ).toContain("100.0%");
  });

  it("fails when a collected project has no production source", function () {
    using root = createTempDir();
    const project = join(root.path, "packages", "one");
    const coverage = join(root.path, "dist", "coverage");
    const profile = join(coverage, "raw", "one");
    mkdirSync(project, { recursive: true });
    mkdirSync(profile, { recursive: true });
    writeFileSync(join(project, "package.json"), '{"name":"@probe/one"}');
    writeFileSync(join(profile, "lcov.info"), "");
    expect(function () {
      reportTestCoverage({ workspaceRoot: root.path, coverageRoot: coverage });
    }).toThrow("coverage recorded no production sources");
  });
});
