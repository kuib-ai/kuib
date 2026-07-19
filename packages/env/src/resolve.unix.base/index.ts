// @context @journal/application-directories
import { homedir, tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import PathKind, { PathKindEnum } from "../path.kind";
import type { PathKind as PathKindType } from "../path.kind";

const envOr = function (key: string, fallback: () => string): string {
  const value = process.env[key];
  if (value !== undefined && value.length > 0 && isAbsolute(value)) {
    return value;
  }
  return fallback();
};

const resolveUnixBase = function (kind: PathKindType): string {
  const parsed = PathKind.parse(kind);
  switch (parsed) {
    case PathKindEnum.CONFIG:
      return envOr("XDG_CONFIG_HOME", function () {
        return join(homedir(), ".config");
      });
    case PathKindEnum.DATA:
      return envOr("XDG_DATA_HOME", function () {
        return join(homedir(), ".local", "share");
      });
    case PathKindEnum.STATE:
      return envOr("XDG_STATE_HOME", function () {
        return join(homedir(), ".local", "state");
      });
    case PathKindEnum.CACHE:
      return envOr("XDG_CACHE_HOME", function () {
        return join(homedir(), ".cache");
      });
    case PathKindEnum.RUNTIME:
      return envOr("XDG_RUNTIME_DIR", function () {
        return tmpdir();
      });
  }
};

export default resolveUnixBase;
