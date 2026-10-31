// @claim infra
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "@kuib-ai/testing/override.env";
import { PathKindEnum } from "../path.kind/index.ts";
import resolvePlatformBase from "./index.ts";

describe("resolvePlatformBase", function () {
  it("routes win32 to Windows bases", function () {
    using _env = overrideEnv({
      XDG_CONFIG_HOME: undefined,
      APPDATA: "C:\\Roaming",
    });

    expect(
      resolvePlatformBase(PathKindEnum.CONFIG, { platform: "win32" }),
    ).toBe("C:\\Roaming");
  });

  it("routes darwin/linux to Unix bases", function () {
    using _env = overrideEnv({
      XDG_CACHE_HOME: "/tmp/xdg-cache",
    });

    expect(
      resolvePlatformBase(PathKindEnum.CACHE, { platform: "darwin" }),
    ).toBe("/tmp/xdg-cache");
    expect(resolvePlatformBase(PathKindEnum.CACHE, { platform: "linux" })).toBe(
      "/tmp/xdg-cache",
    );
  });
});
