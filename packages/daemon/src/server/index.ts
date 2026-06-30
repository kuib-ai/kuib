// @context @journal/architecture-overview
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import daemonRouter from "../daemon.router";

const createDaemonServer = function (port: number) {
  const server = createHTTPServer({ router: daemonRouter });
  server.listen(port);
  return server;
};

export default createDaemonServer;
