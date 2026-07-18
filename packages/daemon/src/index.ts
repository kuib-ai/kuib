// @context @journal/host-layer
import daemonRouter from "./daemon.router";
import createDaemonServer from "./server";
import createDaemonCaller from "./daemon.caller";
import ensureDaemon from "./ensure.daemon";
import ensureLocalDaemon from "./ensure.local.daemon";
import resolveDaemonEndpoint from "./resolve.daemon.endpoint";

const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
  ensureDaemon,
  ensureLocalDaemon,
  resolveDaemonEndpoint,
};

export default Daemon;
