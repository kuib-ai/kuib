// @context @journal/domains/core#^C036
import Trpc from "../trpc/index.ts";
import daemonRouter from "../daemon.router/index.ts";

const createDaemonCaller = Trpc.createCallerFactory(daemonRouter);

export default createDaemonCaller;
