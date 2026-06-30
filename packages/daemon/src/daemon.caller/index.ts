// @context @journal/architecture-overview
import Trpc from "../trpc";
import daemonRouter from "../daemon.router";

const createDaemonCaller = Trpc.createCallerFactory(daemonRouter);

export default createDaemonCaller;
