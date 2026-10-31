// @claim infra
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "@kuib-ai/testing/override.env";
import changeCwd from "@kuib-ai/testing/change.cwd";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind/index.ts";
import resolveDir from "./index.ts";

describe("resolveDir", function () {
  it("uses dist/<kind> as the base dir outside production", function () {
    using temp = createTempDir("env-dir-");
    const root = temp.path;
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(root, "packages", "env");
    mkdirSync(nested, { recursive: true });
    using _cwd = changeCwd(nested);
    using _env = overrideEnv({
      NODE_ENV: "development",
    });

    const dir = resolveDir(PathKindEnum.CONFIG);
    expect(dir).toBe(join(root, "dist", "config"));
    expect(existsSync(dir)).toBe(false);
  });

  it("uses the platform base in production (no app suffix)", function () {
    using temp = createTempDir("env-xdg-");
    const xdg = temp.path;
    using _env = overrideEnv({
      NODE_ENV: "production",
      XDG_CONFIG_HOME: xdg,
    });

    expect(resolveDir(PathKindEnum.CONFIG)).toBe(xdg);
  });

  it("honors { dev: false } outside production", function () {
    using temp = createTempDir("env-xdg-");
    const xdg = temp.path;
    using _env = overrideEnv({
      NODE_ENV: "development",
      XDG_CONFIG_HOME: xdg,
    });

    expect(resolveDir(PathKindEnum.CONFIG, { dev: false })).toBe(xdg);
  });

  it("honors { dev: true } in production", function () {
    using temp = createTempDir("env-dir-");
    const root = temp.path;
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    using _env = overrideEnv({
      NODE_ENV: "production",
    });

    expect(resolveDir(PathKindEnum.DATA, { dev: true, cwd: root })).toBe(
      join(root, "dist", "data"),
    );
  });
});
