// @context @journal/domains/infra#^C012
import ResolveDirsOptions from "../resolve.dirs.options/index.ts";
import type { ResolveDirsOptions as ResolveDirsOptionsType } from "../resolve.dirs.options/index.ts";
import PathKind from "../path.kind/index.ts";
import type { PathKind as PathKindType } from "../path.kind/index.ts";
import resolveUnixBase from "../resolve.unix.base/index.ts";
import resolveWindowsBase from "../resolve.windows.base/index.ts";

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
