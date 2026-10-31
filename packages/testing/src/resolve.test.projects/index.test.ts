import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import resolveTestProjects from "./index.ts";

describe("resolveTestProjects", function () {
  it("lists package manifests under the workspace project folders", function () {
    using root = createTempDir();
    for (const path of [
      "apps/host",
      "packages/one",
      "packages/empty",
      "tooling",
    ]) {
      mkdirSync(join(root.path, path), { recursive: true });
    }
    for (const path of ["apps/host", "packages/one", "tooling"]) {
      writeFileSync(join(root.path, path, "package.json"), "{}");
    }
    expect(resolveTestProjects(root.path)).toEqual([
      join(root.path, "apps/host"),
      join(root.path, "packages/one"),
      join(root.path, "tooling"),
    ]);
  });
});
