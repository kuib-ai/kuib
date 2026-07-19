// @context @journal/application-directories
import { describe, it, expect } from "bun:test";
import { PathKindEnum } from "../path.kind";
import resolvePlatformBase from "./index";

describe("resolvePlatformBase", function () {
  it("routes win32 to Windows bases", function () {
    const prevAppData = process.env["APPDATA"];
    const prevXdg = process.env["XDG_CONFIG_HOME"];
    delete process.env["XDG_CONFIG_HOME"];
    process.env["APPDATA"] = "C:\\Roaming";

    expect(
      resolvePlatformBase(PathKindEnum.CONFIG, { platform: "win32" }),
    ).toBe("C:\\Roaming");

    process.env["APPDATA"] = prevAppData;
    process.env["XDG_CONFIG_HOME"] = prevXdg;
  });

  it("routes darwin/linux to Unix bases", function () {
    const prev = process.env["XDG_CACHE_HOME"];
    process.env["XDG_CACHE_HOME"] = "/tmp/xdg-cache";

    expect(
      resolvePlatformBase(PathKindEnum.CACHE, { platform: "darwin" }),
    ).toBe("/tmp/xdg-cache");
    expect(resolvePlatformBase(PathKindEnum.CACHE, { platform: "linux" })).toBe(
      "/tmp/xdg-cache",
    );

    process.env["XDG_CACHE_HOME"] = prev;
  });
});
