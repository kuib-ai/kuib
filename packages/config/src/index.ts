// @context @journal/architecture-overview @journal/application-directories
import AppPaths from "./app.paths";
import KuibConfig from "./kuib.config";
import bootstrapConfig from "./bootstrap.config";
import ensureAppPaths from "./ensure.app.paths";
import resolveAppPaths from "./resolve.app.paths";

const Config = {
  AppPaths,
  KuibConfig,
  bootstrapConfig,
  ensureAppPaths,
  resolveAppPaths,
};

export default Config;
