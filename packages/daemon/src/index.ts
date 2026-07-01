// @context @journal/host-layer
import daemonRouter from "./daemon.router";
import createDaemonServer from "./server";
import createDaemonCaller from "./daemon.caller";
import ensureDaemon from "./ensure.daemon";
import resolveDaemonSocketPath from "./daemon.socket.path";

const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
  ensureDaemon,
  resolveDaemonSocketPath,
};

export default Daemon;
