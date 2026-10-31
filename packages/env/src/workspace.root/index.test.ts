import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import findWorkspaceRoot from "./index.ts";

describe("findWorkspaceRoot", function () {
  it("walks up to the directory containing pnpm-workspace.yaml", function () {
    using temp = createTempDir("wsroot-");
    const rootDir = temp.path;
    writeFileSync(join(rootDir, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(rootDir, "packages", "foo", "src");
    mkdirSync(nested, { recursive: true });

    expect(findWorkspaceRoot(nested)).toBe(rootDir);
  });

  it("returns the original start when the marker is never found", function () {
    using temp = createTempDir("wsroot-none-");
    const bare = temp.path;
    const nested = join(bare, "a", "b");
    mkdirSync(nested, { recursive: true });

    expect(findWorkspaceRoot(nested)).toBe(nested);
  });
});
