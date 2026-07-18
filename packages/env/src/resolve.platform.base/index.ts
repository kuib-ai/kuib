// @context @journal/application-directories
import ResolveDirsOptions from "../resolve.dirs.options";
import type { ResolveDirsOptions as ResolveDirsOptionsType } from "../resolve.dirs.options";
import PathKind from "../path.kind";
import type { PathKind as PathKindType } from "../path.kind";
import resolveUnixBase from "../resolve.unix.base";
import resolveWindowsBase from "../resolve.windows.base";

const resolvePlatformBase = function (
  kind: PathKindType,
  options?: ResolveDirsOptionsType,
): string {
  const parsedKind = PathKind.parse(kind);
  const parsedOptions = ResolveDirsOptions.parse(options ?? {});
  const platform = parsedOptions.platform ?? process.platform;

  if (platform === "win32") {
    return resolveWindowsBase(parsedKind);
  }
  return resolveUnixBase(parsedKind);
};

export default resolvePlatformBase;
