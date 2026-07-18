// @context @journal/application-directories
import BaseDirs from "../base.dirs";
import type { BaseDirs as BaseDirsType } from "../base.dirs";
import { PathKindEnum } from "../path.kind";
import type { ResolveDirsOptions } from "../resolve.dirs.options";
import resolveDir from "../resolve.dir";

const resolveDirs = function (options?: ResolveDirsOptions): BaseDirsType {
  return BaseDirs.parse({
    config: resolveDir(PathKindEnum.CONFIG, options),
    data: resolveDir(PathKindEnum.DATA, options),
    state: resolveDir(PathKindEnum.STATE, options),
    cache: resolveDir(PathKindEnum.CACHE, options),
    runtime: resolveDir(PathKindEnum.RUNTIME, options),
  });
};

export default resolveDirs;
