// @claim host/host-logging
import type { BootstrapConfig } from "@kuib-ai/config/bootstrap.config";
import createPinoLogger from "@kuib-ai/std/pino";

// @claim host/host-logging
const createLog = function (bootstrap: BootstrapConfig) {
  return createPinoLogger({
    name: "host-tui",
    level: bootstrap.config.logging.level,
    destination: bootstrap.paths.log,
    pretty: bootstrap.runtime.mode !== "production",
  }).child({ logPath: bootstrap.paths.log });
};

export default createLog;
