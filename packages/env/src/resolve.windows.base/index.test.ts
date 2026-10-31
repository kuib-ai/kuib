// @claim infra
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "@kuib-ai/testing/override.env";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind/index.ts";
import resolveWindowsBase from "./index.ts";

describe("resolveWindowsBase", function () {
  it("maps config to APPDATA and data/state/cache to LOCALAPPDATA", function () {
    using _env = overrideEnv({
      XDG_CONFIG_HOME: undefined,
      XDG_DATA_HOME: undefined,
      XDG_STATE_HOME: undefined,
      XDG_CACHE_HOME: undefined,
      APPDATA: "C:\\Users\\me\\AppData\\Roaming",
      LOCALAPPDATA: "C:\\Users\\me\\AppData\\Local",
    });

    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe(
      "C:\\Users\\me\\AppData\\Roaming",
    );
    expect(resolveWindowsBase(PathKindEnum.DATA)).toBe(
      "C:\\Users\\me\\AppData\\Local",
    );
    expect(resolveWindowsBase(PathKindEnum.STATE)).toBe(
      "C:\\Users\\me\\AppData\\Local",
    );
    expect(resolveWindowsBase(PathKindEnum.CACHE)).toBe(
      "C:\\Users\\me\\AppData\\Local",
    );
  });

  it("prefers XDG_* when set on Windows", function () {
    using _env = overrideEnv({
      XDG_CONFIG_HOME: "D:\\xdg\\config",
    });
    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe("D:\\xdg\\config");
  });

  it("falls back to TEMP for runtime", function () {
    using _env = overrideEnv({
      XDG_RUNTIME_DIR: undefined,
      TEMP: undefined,
    });
    expect(resolveWindowsBase(PathKindEnum.RUNTIME)).toBe(tmpdir());
  });

  it("falls back to userprofile AppData when APPDATA is unset", function () {
    using _env = overrideEnv({
      APPDATA: undefined,
      XDG_CONFIG_HOME: undefined,
    });
    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), "AppData", "Roaming"),
    );
  });

  it("ignores relative XDG and AppData paths", function () {
    using _env = overrideEnv({
      APPDATA: "relative\\roaming",
      XDG_CONFIG_HOME: "relative\\config",
    });

    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), "AppData", "Roaming"),
    );
  });
});
