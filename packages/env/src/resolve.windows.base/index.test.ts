// @context @journal/application-directories
import { describe, it, expect } from "bun:test";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { PathKindEnum } from "../path.kind";
import resolveWindowsBase from "./index";

describe("resolveWindowsBase", () => {
  it("maps config to APPDATA and data/state/cache to LOCALAPPDATA", () => {
    const prevAppData = process.env["APPDATA"];
    const prevLocal = process.env["LOCALAPPDATA"];
    const prevXdgConfig = process.env["XDG_CONFIG_HOME"];
    const prevXdgData = process.env["XDG_DATA_HOME"];
    const prevXdgState = process.env["XDG_STATE_HOME"];
    const prevXdgCache = process.env["XDG_CACHE_HOME"];
    delete process.env["XDG_CONFIG_HOME"];
    delete process.env["XDG_DATA_HOME"];
    delete process.env["XDG_STATE_HOME"];
    delete process.env["XDG_CACHE_HOME"];
    process.env["APPDATA"] = "C:\\Users\\me\\AppData\\Roaming";
    process.env["LOCALAPPDATA"] = "C:\\Users\\me\\AppData\\Local";

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

    process.env["APPDATA"] = prevAppData;
    process.env["LOCALAPPDATA"] = prevLocal;
    process.env["XDG_CONFIG_HOME"] = prevXdgConfig;
    process.env["XDG_DATA_HOME"] = prevXdgData;
    process.env["XDG_STATE_HOME"] = prevXdgState;
    process.env["XDG_CACHE_HOME"] = prevXdgCache;
  });

  it("prefers XDG_* when set on Windows", () => {
    const prev = process.env["XDG_CONFIG_HOME"];
    process.env["XDG_CONFIG_HOME"] = "D:\\xdg\\config";
    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe("D:\\xdg\\config");
    process.env["XDG_CONFIG_HOME"] = prev;
  });

  it("falls back to TEMP for runtime", () => {
    const prevRuntime = process.env["XDG_RUNTIME_DIR"];
    const prevTemp = process.env["TEMP"];
    delete process.env["XDG_RUNTIME_DIR"];
    delete process.env["TEMP"];
    expect(resolveWindowsBase(PathKindEnum.RUNTIME)).toBe(tmpdir());
    process.env["XDG_RUNTIME_DIR"] = prevRuntime;
    process.env["TEMP"] = prevTemp;
  });

  it("falls back to userprofile AppData when APPDATA is unset", () => {
    const prevAppData = process.env["APPDATA"];
    const prevXdg = process.env["XDG_CONFIG_HOME"];
    delete process.env["APPDATA"];
    delete process.env["XDG_CONFIG_HOME"];
    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), "AppData", "Roaming"),
    );
    process.env["APPDATA"] = prevAppData;
    process.env["XDG_CONFIG_HOME"] = prevXdg;
  });

  it("ignores relative XDG and AppData paths", () => {
    const prevAppData = process.env["APPDATA"];
    const prevXdg = process.env["XDG_CONFIG_HOME"];
    process.env["APPDATA"] = "relative\\roaming";
    process.env["XDG_CONFIG_HOME"] = "relative\\config";

    expect(resolveWindowsBase(PathKindEnum.CONFIG)).toBe(
      join(homedir(), "AppData", "Roaming"),
    );

    process.env["APPDATA"] = prevAppData;
    process.env["XDG_CONFIG_HOME"] = prevXdg;
  });
});
