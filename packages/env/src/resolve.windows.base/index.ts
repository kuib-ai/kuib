// @context @journal/application-directories
import { homedir, tmpdir } from "node:os";
import { join, win32 } from "node:path";
import PathKind, { PathKindEnum } from "../path.kind";
import type { PathKind as PathKindType } from "../path.kind";

const envOr = function (key: string, fallback: () => string): string {
  const value = process.env[key];
  if (value !== undefined && value.length > 0 && win32.isAbsolute(value)) {
    return value;
  }
  return fallback();
};

const resolveWindowsBase = function (kind: PathKindType): string {
  const parsed = PathKind.parse(kind);
  const roaming = function () {
    return envOr("APPDATA", function () {
      return join(homedir(), "AppData", "Roaming");
    });
  };
  const local = function () {
    return envOr("LOCALAPPDATA", function () {
      return join(homedir(), "AppData", "Local");
    });
  };

  switch (parsed) {
    case PathKindEnum.CONFIG:
      return envOr("XDG_CONFIG_HOME", roaming);
    case PathKindEnum.DATA:
      return envOr("XDG_DATA_HOME", local);
    case PathKindEnum.STATE:
      return envOr("XDG_STATE_HOME", local);
    case PathKindEnum.CACHE:
      return envOr("XDG_CACHE_HOME", local);
    case PathKindEnum.RUNTIME:
      return envOr("XDG_RUNTIME_DIR", function () {
        return envOr("TEMP", function () {
          return tmpdir();
        });
      });
  }
};

export default resolveWindowsBase;
