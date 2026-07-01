import { describe, it, expect } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import resolveMeshConfigPath from "./index";

describe("resolveMeshConfigPath", () => {
  it("returns the configured path verbatim when provided", () => {
    expect(resolveMeshConfigPath("/custom/mesh.toml")).toBe(
      "/custom/mesh.toml",
    );
  });

  it("uses XDG_CONFIG_HOME/kuib/mesh.config.toml when no path configured", () => {
    const prev = process.env["XDG_CONFIG_HOME"];
    process.env["XDG_CONFIG_HOME"] = "/xdg";
    expect(resolveMeshConfigPath()).toBe("/xdg/kuib/mesh.config.toml");
    if (prev === undefined) {
      delete process.env["XDG_CONFIG_HOME"];
    } else {
      process.env["XDG_CONFIG_HOME"] = prev;
    }
  });

  it("falls back to ~/.config when XDG_CONFIG_HOME is unset", () => {
    const prev = process.env["XDG_CONFIG_HOME"];
    delete process.env["XDG_CONFIG_HOME"];
    expect(resolveMeshConfigPath()).toBe(
      join(homedir(), ".config", "kuib", "mesh.config.toml"),
    );
    if (prev !== undefined) {
      process.env["XDG_CONFIG_HOME"] = prev;
    }
  });
});
