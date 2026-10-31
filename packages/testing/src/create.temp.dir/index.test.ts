import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import createTempDir from "./index.ts";

describe("createTempDir", function () {
  it("creates a folder under the temp folder with the given prefix", function () {
    using dir = createTempDir("temp-dir-");

    expect(statSync(dir.path).isDirectory()).toBe(true);
    expect(basename(dir.path).startsWith("temp-dir-")).toBe(true);
    expect(dirname(dir.path)).toBe(tmpdir());
  });

  it("removes the folder and what it holds when the scope ends", function () {
    let path = "";
    const scope = function (): void {
      using dir = createTempDir();
      path = dir.path;
      writeFileSync(join(path, "note.txt"), "kept until the scope ends");
    };

    scope();

    expect(path.length).toBeGreaterThan(0);
    expect(existsSync(path)).toBe(false);
  });

  it("removes the folder when the scope ends by throwing", function () {
    let path = "";
    const scope = function (): void {
      using dir = createTempDir();
      path = dir.path;
      throw new Error("the test failed");
    };

    expect(scope).toThrow("the test failed");
    expect(existsSync(path)).toBe(false);
  });

  it("creates the folder under a given parent", function () {
    using parent = createTempDir("parent-");
    using child = createTempDir("child-", parent.path);

    expect(dirname(child.path)).toBe(parent.path);
  });
});
