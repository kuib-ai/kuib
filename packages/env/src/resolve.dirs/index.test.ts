// @context @journal/application-directories
import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import resolveDirs from "./index";

describe("resolveDirs", () => {
  it("returns the five bases under dist in development", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "env-dirs-")));
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(root, "apps", "host-tui");
    mkdirSync(nested, { recursive: true });

    const prevCwd = process.cwd();
    const prevNodeEnv = process.env["NODE_ENV"];
    process.chdir(nested);
    process.env["NODE_ENV"] = "development";

    expect(resolveDirs()).toEqual({
      config: join(root, "dist", "config"),
      data: join(root, "dist", "data"),
      state: join(root, "dist", "state"),
      cache: join(root, "dist", "cache"),
      runtime: join(root, "dist", "runtime"),
    });

    process.chdir(prevCwd);
    process.env["NODE_ENV"] = prevNodeEnv;
  });

  it("returns platform bases when { dev: false }", () => {
    const base = mkdtempSync(join(tmpdir(), "env-bases-"));
    const prevNodeEnv = process.env["NODE_ENV"];
    const prevConfig = process.env["XDG_CONFIG_HOME"];
    const prevData = process.env["XDG_DATA_HOME"];
    const prevState = process.env["XDG_STATE_HOME"];
    const prevCache = process.env["XDG_CACHE_HOME"];
    const prevRuntime = process.env["XDG_RUNTIME_DIR"];

    process.env["NODE_ENV"] = "development";
    process.env["XDG_CONFIG_HOME"] = join(base, "config");
    process.env["XDG_DATA_HOME"] = join(base, "data");
    process.env["XDG_STATE_HOME"] = join(base, "state");
    process.env["XDG_CACHE_HOME"] = join(base, "cache");
    process.env["XDG_RUNTIME_DIR"] = join(base, "runtime");

    expect(resolveDirs({ dev: false })).toEqual({
      config: join(base, "config"),
      data: join(base, "data"),
      state: join(base, "state"),
      cache: join(base, "cache"),
      runtime: join(base, "runtime"),
    });

    process.env["NODE_ENV"] = prevNodeEnv;
    process.env["XDG_CONFIG_HOME"] = prevConfig;
    process.env["XDG_DATA_HOME"] = prevData;
    process.env["XDG_STATE_HOME"] = prevState;
    process.env["XDG_CACHE_HOME"] = prevCache;
    process.env["XDG_RUNTIME_DIR"] = prevRuntime;
  });
});
