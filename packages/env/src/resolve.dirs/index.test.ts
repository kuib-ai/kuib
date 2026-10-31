// @claim infra
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "@kuib-ai/testing/override.env";
import changeCwd from "@kuib-ai/testing/change.cwd";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import resolveDirs from "./index.ts";

describe("resolveDirs", function () {
  it("returns the five bases under dist in development", function () {
    using temp = createTempDir("env-dirs-");
    const root = temp.path;
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(root, "apps", "host-tui");
    mkdirSync(nested, { recursive: true });
    using _cwd = changeCwd(nested);
    using _env = overrideEnv({
      NODE_ENV: "development",
    });

    expect(resolveDirs()).toEqual({
      config: join(root, "dist", "config"),
      data: join(root, "dist", "data"),
      state: join(root, "dist", "state"),
      cache: join(root, "dist", "cache"),
      runtime: join(root, "dist", "runtime"),
    });
  });

  it("returns platform bases when { dev: false }", function () {
    using temp = createTempDir("env-bases-");
    const base = temp.path;

    using _env = overrideEnv({
      NODE_ENV: "development",
      XDG_CONFIG_HOME: join(base, "config"),
      XDG_DATA_HOME: join(base, "data"),
      XDG_STATE_HOME: join(base, "state"),
      XDG_CACHE_HOME: join(base, "cache"),
      XDG_RUNTIME_DIR: join(base, "runtime"),
    });

    expect(resolveDirs({ dev: false })).toEqual({
      config: join(base, "config"),
      data: join(base, "data"),
      state: join(base, "state"),
      cache: join(base, "cache"),
      runtime: join(base, "runtime"),
    });
  });
});
