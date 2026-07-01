// @context @journal/host-layer
import { rmSync } from "node:fs";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import daemonRouter from "../daemon.router";

const createDaemonServer = function (socketPath: string) {
  rmSync(socketPath, { force: true });
  const server = createHTTPServer({ router: daemonRouter });
  server.listen(socketPath);
  return server;
};

export default createDaemonServer;
