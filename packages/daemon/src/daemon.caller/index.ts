// @claim core/daemon-router
import Trpc from "../trpc/index.ts";
import daemonRouter from "../daemon.router/index.ts";

// @claim core/daemon-router
const createDaemonCaller = Trpc.createCallerFactory(daemonRouter);

export default createDaemonCaller;
