// @context @journal/architecture-overview @journal/application-directories
import AppPaths from "./app.paths/index.ts";
import KuibConfig from "./kuib.config/index.ts";
import bootstrapConfig from "./bootstrap.config/index.ts";
import ensureAppPaths from "./ensure.app.paths/index.ts";
import resolveAppPaths from "./resolve.app.paths/index.ts";

const Config = {
  AppPaths,
  KuibConfig,
  bootstrapConfig,
  ensureAppPaths,
  resolveAppPaths,
};

export default Config;
