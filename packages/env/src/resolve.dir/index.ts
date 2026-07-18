// @context @journal/application-directories
import { join } from "node:path";
import PathKind from "../path.kind";
import type { PathKind as PathKindType } from "../path.kind";
import ResolveDirsOptions from "../resolve.dirs.options";
import type { ResolveDirsOptions as ResolveDirsOptionsType } from "../resolve.dirs.options";
import resolveIsDev from "../resolve.is.dev";
import resolveDevRoot from "../resolve.dev.root";
import resolvePlatformBase from "../resolve.platform.base";

const resolveDir = function (
  kind: PathKindType,
  options?: ResolveDirsOptionsType,
): string {
  const parsedKind = PathKind.parse(kind);
  const parsedOptions = ResolveDirsOptions.parse(options ?? {});
  return resolveIsDev(parsedOptions)
    ? join(resolveDevRoot(parsedOptions.cwd), parsedKind)
    : resolvePlatformBase(parsedKind, parsedOptions);
};

export default resolveDir;
