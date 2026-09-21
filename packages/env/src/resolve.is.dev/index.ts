// @context @journal/application-directories
import ResolveDirsOptions from "../resolve.dirs.options/index.ts";
import type { ResolveDirsOptions as ResolveDirsOptionsType } from "../resolve.dirs.options/index.ts";
import isProduction from "../is.production/index.ts";

const resolveIsDev = function (options?: ResolveDirsOptionsType): boolean {
  const parsed = ResolveDirsOptions.parse(options ?? {});
  if (parsed.dev !== undefined) {
    return parsed.dev;
  }
  return !isProduction();
};

export default resolveIsDev;
