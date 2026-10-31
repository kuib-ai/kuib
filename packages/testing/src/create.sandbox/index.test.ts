import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import createSandbox from "./index.ts";

describe("createSandbox", function () {
  it("creates a home, a temp folder, a slot folder and sixteen socket paths under one root", function () {
    using parent = createTempDir("sandbox-parent-");
    using sandbox = createSandbox(parent.path);

    expect(dirname(sandbox.root)).toBe(parent.path);
    expect(statSync(sandbox.home).isDirectory()).toBe(true);
    expect(statSync(sandbox.temp).isDirectory()).toBe(true);
    expect(sandbox.home).toBe(join(sandbox.root, "home"));
    expect(sandbox.temp).toBe(join(sandbox.root, "tmp"));
    expect(statSync(sandbox.slots).isDirectory()).toBe(true);
    expect(sandbox.slots).toBe(join(sandbox.root, "slots"));
    expect(sandbox.sockets.length).toBe(16);
    expect(new Set(sandbox.sockets).size).toBe(16);
    for (const socket of sandbox.sockets) {
      expect(dirname(socket)).toBe(join(sandbox.root, "s"));
      expect(existsSync(socket)).toBe(false);
    }
  });

  it("removes the root and everything written into it when the scope ends", function () {
    using parent = createTempDir("sandbox-parent-");
    let root = "";
    const scope = function (): void {
      using sandbox = createSandbox(parent.path);
      root = sandbox.root;
      writeFileSync(join(sandbox.temp, "left-behind.txt"), "by a test");
    };

    scope();

    expect(root.length).toBeGreaterThan(0);
    expect(existsSync(root)).toBe(false);
  });
});
