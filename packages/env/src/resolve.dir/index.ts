// @context @journal/domains/infra#^C012
import { join } from "node:path";
import PathKind from "../path.kind/index.ts";
import type { PathKind as PathKindType } from "../path.kind/index.ts";
import ResolveDirsOptions from "../resolve.dirs.options/index.ts";
import type { ResolveDirsOptions as ResolveDirsOptionsType } from "../resolve.dirs.options/index.ts";
import resolveIsDev from "../resolve.is.dev/index.ts";
import resolveDevRoot from "../resolve.dev.root/index.ts";
import resolvePlatformBase from "../resolve.platform.base/index.ts";

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
