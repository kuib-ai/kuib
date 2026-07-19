// @context @journal/host-layer
import { rmSync } from "node:fs";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import daemonRouter from "../daemon.router";

const createDaemonServer = function (socketPath: string, port?: number) {
  rmSync(socketPath, { force: true });
  const server = createHTTPServer({ router: daemonRouter });
  server.listen(socketPath);
  if (port !== undefined && !Number.isNaN(port)) {
    const tcpServer = createHTTPServer({ router: daemonRouter });
    tcpServer.on("error", function () {});
    tcpServer.listen(port);
  }
  return server;
};

export default createDaemonServer;
