import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import findWorkspaceRoot from "./index";

describe("findWorkspaceRoot", function () {
  it("walks up to the directory containing pnpm-workspace.yaml", function () {
    const rootDir = mkdtempSync(join(tmpdir(), "wsroot-"));
    writeFileSync(join(rootDir, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(rootDir, "packages", "foo", "src");
    mkdirSync(nested, { recursive: true });

    expect(findWorkspaceRoot(nested)).toBe(rootDir);
  });

  it("returns the original start when the marker is never found", function () {
    const bare = mkdtempSync(join(tmpdir(), "wsroot-none-"));
    const nested = join(bare, "a", "b");
    mkdirSync(nested, { recursive: true });

    expect(findWorkspaceRoot(nested)).toBe(nested);
  });
});
