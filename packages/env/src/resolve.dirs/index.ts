// @context @journal/application-directories
import BaseDirs from "../base.dirs/index.ts";
import type { BaseDirs as BaseDirsType } from "../base.dirs/index.ts";
import { PathKindEnum } from "../path.kind/index.ts";
import type { ResolveDirsOptions } from "../resolve.dirs.options/index.ts";
import resolveDir from "../resolve.dir/index.ts";

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
