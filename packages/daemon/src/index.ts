// @claim core/package-barrels
import daemonRouter from "./daemon.router/index.ts";
import createDaemonServer from "./server/index.ts";
import createDaemonCaller from "./daemon.caller/index.ts";
import ensureDaemon from "./ensure.daemon/index.ts";
import ensureLocalDaemon from "./ensure.local.daemon/index.ts";
import resolveDaemonEndpoint from "./resolve.daemon.endpoint/index.ts";

// @claim core/package-barrels
const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
  ensureDaemon,
  ensureLocalDaemon,
  resolveDaemonEndpoint,
};

export default Daemon;
