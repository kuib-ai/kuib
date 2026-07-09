import { describe, it, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import Env from "@kuib-ai/env";
import resolveDbPath from "./index";

describe("resolveDbPath", () => {
  it("returns the configured path verbatim without touching env", () => {
    expect(resolveDbPath("/custom/where/my.db")).toBe("/custom/where/my.db");
  });

  it("uses XDG_DATA_HOME/kuib and creates it in production", () => {
    const dataHome = mkdtempSync(join(tmpdir(), "kuib-xdg-"));
    const prevNodeEnv = process.env["NODE_ENV"];
    const prevXdg = process.env["XDG_DATA_HOME"];
    process.env["NODE_ENV"] = "production";
    process.env["XDG_DATA_HOME"] = dataHome;

    const result = resolveDbPath();

    process.env["NODE_ENV"] = prevNodeEnv;
    process.env["XDG_DATA_HOME"] = prevXdg;

    expect(result).toBe(join(dataHome, "kuib", "kuib.db"));
    expect(existsSync(join(dataHome, "kuib"))).toBe(true);
  });

  it("uses the workspace dist dir and creates it in dev", () => {
    const prevNodeEnv = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "development";

    const result = resolveDbPath();

    process.env["NODE_ENV"] = prevNodeEnv;

    const dist = join(Env.findWorkspaceRoot(process.cwd()), "dist");
    expect(result).toBe(join(dist, "kuib.db"));
    expect(existsSync(dist)).toBe(true);
  });
});
