// @context @journal/domains/core#^C002
import daemonRouter from "./daemon.router/index.ts";
import createDaemonServer from "./server/index.ts";
import createDaemonCaller from "./daemon.caller/index.ts";
import ensureDaemon from "./ensure.daemon/index.ts";
import ensureLocalDaemon from "./ensure.local.daemon/index.ts";
import resolveDaemonEndpoint from "./resolve.daemon.endpoint/index.ts";

const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
  ensureDaemon,
  ensureLocalDaemon,
  resolveDaemonEndpoint,
};

export default Daemon;
