// @claim infra
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "@kuib-ai/testing/override.env";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind/index.ts";
import resolveUnixBase from "./index.ts";

describe("resolveUnixBase", function () {
  it("prefers XDG_* env vars when set", function () {
    using _env = overrideEnv({
      XDG_DATA_HOME: "/custom/data",
    });
    expect(resolveUnixBase(PathKindEnum.DATA)).toBe("/custom/data");
  });

  it("falls back to the XDG defaults", function () {
    using _env = overrideEnv({
      XDG_CONFIG_HOME: undefined,
      XDG_RUNTIME_DIR: undefined,
    });

    expect(resolveUnixBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), ".config"),
    );
    expect(resolveUnixBase(PathKindEnum.RUNTIME)).toBe(tmpdir());
  });

  it("ignores relative XDG paths", function () {
    using _env = overrideEnv({
      XDG_CONFIG_HOME: "relative/config",
    });

    expect(resolveUnixBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), ".config"),
    );
  });
});
