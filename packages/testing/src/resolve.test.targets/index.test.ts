import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import resolveTestTargets from "./index.ts";

describe("resolveTestTargets", function () {
  it("groups files by the nearest owning project", function () {
    using root = createTempDir();
    const first = join(root.path, "packages", "first");
    const second = join(root.path, "packages", "second");
    mkdirSync(join(first, "src"), { recursive: true });
    mkdirSync(join(second, "src"), { recursive: true });
    writeFileSync(join(first, "package.json"), '{"name":"first"}');
    writeFileSync(join(second, "package.json"), '{"name":"second"}');
    writeFileSync(join(first, "src", "one.test.ts"), "");
    writeFileSync(join(first, "src", "two.test.ts"), "");
    const targets = resolveTestTargets(
      root.path,
      [
        "packages/first/src/one.test.ts",
        "packages/first/src/two.test.ts",
        "packages/second",
      ],
      root.path,
    );
    expect(targets).toEqual([
      {
        project: first,
        name: "first",
        files: ["src/one.test.ts", "src/two.test.ts"],
      },
      { project: second, name: "second", files: [] },
    ]);
  });

  it("rejects a path outside a project", function () {
    using root = createTempDir();
    writeFileSync(join(root.path, "package.json"), '{"name":"root"}');
    expect(function () {
      resolveTestTargets(root.path, ["."], root.path);
    }).toThrow("is not inside a project");
  });
});
