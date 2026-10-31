import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import resolveTestFiles from "./index.ts";

describe("resolveTestFiles", function () {
  it("selects unit patterns within a folder and excludes live tests", function () {
    using root = createTempDir();
    mkdirSync(join(root.path, "src"));
    expect(
      resolveTestFiles(
        TestKindEnum.TEST,
        { project: root.path, name: "sample", files: ["src"] },
        root.path,
      ),
    ).toEqual([
      "--ignore=**/*.live.test.ts,**/*.live.test.tsx",
      join("src", "**/*.test.ts"),
      join("src", "**/*.test.tsx"),
    ]);
  });

  it("adds the workspace env file only for live tests", function () {
    using root = createTempDir();
    writeFileSync(join(root.path, ".env"), "EXAMPLE=1\n");
    const target = { project: root.path, name: "sample", files: [] };
    expect(resolveTestFiles(TestKindEnum.LIVE, target, root.path)[0]).toBe(
      `--env-file=${join(root.path, ".env")}`,
    );
    expect(resolveTestFiles(TestKindEnum.BENCH, target, root.path)).toEqual([
      "**/*.bench.ts",
      "**/*.bench.tsx",
    ]);
  });
});
