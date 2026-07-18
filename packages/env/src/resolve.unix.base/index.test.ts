// @context @journal/application-directories
import { describe, it, expect } from "bun:test";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind";
import resolveUnixBase from "./index";

describe("resolveUnixBase", () => {
  it("prefers XDG_* env vars when set", () => {
    const prev = process.env["XDG_DATA_HOME"];
    process.env["XDG_DATA_HOME"] = "/custom/data";
    expect(resolveUnixBase(PathKindEnum.DATA)).toBe("/custom/data");
    process.env["XDG_DATA_HOME"] = prev;
  });

  it("falls back to the XDG defaults", () => {
    const prevConfig = process.env["XDG_CONFIG_HOME"];
    const prevRuntime = process.env["XDG_RUNTIME_DIR"];
    delete process.env["XDG_CONFIG_HOME"];
    delete process.env["XDG_RUNTIME_DIR"];

    expect(resolveUnixBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), ".config"),
    );
    expect(resolveUnixBase(PathKindEnum.RUNTIME)).toBe(tmpdir());

    process.env["XDG_CONFIG_HOME"] = prevConfig;
    process.env["XDG_RUNTIME_DIR"] = prevRuntime;
  });

  it("ignores relative XDG paths", () => {
    const prev = process.env["XDG_CONFIG_HOME"];
    process.env["XDG_CONFIG_HOME"] = "relative/config";

    expect(resolveUnixBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), ".config"),
    );

    process.env["XDG_CONFIG_HOME"] = prev;
  });
});
