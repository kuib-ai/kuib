// @context @journal/architecture-overview
import daemonRouter from "./daemon.router";
import createDaemonServer from "./server";
import createDaemonCaller from "./daemon.caller";

const Daemon = {
  daemonRouter,
  createDaemonServer,
  createDaemonCaller,
};

export default Daemon;
