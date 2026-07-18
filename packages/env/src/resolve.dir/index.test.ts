// @context @journal/application-directories
import { describe, it, expect } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind";
import resolveDir from "./index";

describe("resolveDir", () => {
  it("uses dist/<kind> as the base dir outside production", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "env-dir-")));
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const nested = join(root, "packages", "env");
    mkdirSync(nested, { recursive: true });

    const prevCwd = process.cwd();
    const prevNodeEnv = process.env["NODE_ENV"];
    process.chdir(nested);
    process.env["NODE_ENV"] = "development";

    const dir = resolveDir(PathKindEnum.CONFIG);
    expect(dir).toBe(join(root, "dist", "config"));
    expect(existsSync(dir)).toBe(false);

    process.chdir(prevCwd);
    process.env["NODE_ENV"] = prevNodeEnv;
  });

  it("uses the platform base in production (no app suffix)", () => {
    const xdg = mkdtempSync(join(tmpdir(), "env-xdg-"));
    const prevNodeEnv = process.env["NODE_ENV"];
    const prevConfig = process.env["XDG_CONFIG_HOME"];
    process.env["NODE_ENV"] = "production";
    process.env["XDG_CONFIG_HOME"] = xdg;

    expect(resolveDir(PathKindEnum.CONFIG)).toBe(xdg);

    process.env["NODE_ENV"] = prevNodeEnv;
    process.env["XDG_CONFIG_HOME"] = prevConfig;
  });

  it("honors { dev: false } outside production", () => {
    const xdg = mkdtempSync(join(tmpdir(), "env-xdg-"));
    const prevNodeEnv = process.env["NODE_ENV"];
    const prevConfig = process.env["XDG_CONFIG_HOME"];
    process.env["NODE_ENV"] = "development";
    process.env["XDG_CONFIG_HOME"] = xdg;

    expect(resolveDir(PathKindEnum.CONFIG, { dev: false })).toBe(xdg);

    process.env["NODE_ENV"] = prevNodeEnv;
    process.env["XDG_CONFIG_HOME"] = prevConfig;
  });

  it("honors { dev: true } in production", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "env-dir-")));
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");

    const prevNodeEnv = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "production";

    expect(resolveDir(PathKindEnum.DATA, { dev: true, cwd: root })).toBe(
      join(root, "dist", "data"),
    );

    process.env["NODE_ENV"] = prevNodeEnv;
  });
});
