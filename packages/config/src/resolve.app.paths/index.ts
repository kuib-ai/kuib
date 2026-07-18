// @context @journal/application-directories
import { join } from "node:path";
import Env from "@kuib-ai/env";
import AppPaths from "../app.paths";
import type { AppPaths as AppPathsType } from "../app.paths";
import type { ConfigOverrides } from "../config.overrides";
import type { ResolveDirsOptions } from "@kuib-ai/env/resolve.dirs.options";

const resolveAppPaths = function (
  overrides: ConfigOverrides = {},
  options?: ResolveDirsOptions,
): AppPathsType {
  const dirs = Env.resolveDirs(options);
  return AppPaths.parse({
    configFile:
      overrides.configFile ?? join(dirs.config, "kuib", "config.toml"),
    meshConfigFile:
      overrides.meshConfigFile ?? join(dirs.config, "kuib", "mesh.config.toml"),
    database: overrides.database ?? join(dirs.data, "kuib", "kuib.db"),
    log: overrides.log ?? join(dirs.state, "kuib", "kuib.log"),
    daemonSocket:
      overrides.daemonSocket ?? join(dirs.runtime, "kuib", "daemon.sock"),
    engineSocket:
      overrides.engineSocket ?? join(dirs.runtime, "kuib", "engine.sock"),
    cacheDir: join(dirs.cache, "kuib"),
  });
};

export default resolveAppPaths;
