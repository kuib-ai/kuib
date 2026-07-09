// @context @journal/host-layer
import daemonRouter from "./daemon.router";
import createDaemonServer from "./server";
import createDaemonCaller from "./daemon.caller";
import ensureDaemon from "./ensure.daemon";
import ensureLocalDaemon from "./ensure.local.daemon";
import resolveDaemonEndpoint from "./resolve.daemon.endpoint";
import resolveDaemonSocketPath from "./daemon.socket.path";
import resolveNodeLabel from "./resolve.node.label";
import resolveMeshConfigPath from "./resolve.mesh.config.path";

const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
  ensureDaemon,
  ensureLocalDaemon,
  resolveDaemonEndpoint,
  resolveDaemonSocketPath,
  resolveNodeLabel,
  resolveMeshConfigPath,
};

export default Daemon;
