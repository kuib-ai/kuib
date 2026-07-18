// @context @journal/application-directories @journal/security-model
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { AppPaths } from "../app.paths";

const ensureAppPaths = function (paths: AppPaths): void {
  const ordinaryDirs = new Set([
    dirname(paths.configFile),
    dirname(paths.meshConfigFile),
    dirname(paths.database),
    dirname(paths.log),
    paths.cacheDir,
  ]);
  for (const dir of ordinaryDirs) {
    mkdirSync(dir, { recursive: true });
  }
  mkdirSync(dirname(paths.daemonSocket), { recursive: true, mode: 0o700 });
  mkdirSync(dirname(paths.engineSocket), { recursive: true, mode: 0o700 });
};

export default ensureAppPaths;
