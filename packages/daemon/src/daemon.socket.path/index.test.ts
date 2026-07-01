import { describe, it, expect } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import Env from "@kuib-ai/env";
import resolveDaemonSocketPath from "./index";

describe("resolveDaemonSocketPath", () => {
  it("returns a configured override verbatim without touching the filesystem", () => {
    expect(resolveDaemonSocketPath("/custom/daemon.sock")).toBe(
      "/custom/daemon.sock",
    );
  });

  it("resolves under workspaceRoot/dist and creates the base when not production", () => {
    const prev = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "development";
    const base = join(Env.findWorkspaceRoot(process.cwd()), "dist");
    const resolved = resolveDaemonSocketPath();
    process.env["NODE_ENV"] = prev;

    expect(resolved).toBe(join(base, "daemon.sock"));
    expect(existsSync(base)).toBe(true);
  });

  it("resolves under homedir/.kuib in production", () => {
    const prev = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "production";
    const resolved = resolveDaemonSocketPath();
    process.env["NODE_ENV"] = prev;

    expect(resolved).toBe(join(homedir(), ".kuib", "daemon.sock"));
  });
});
