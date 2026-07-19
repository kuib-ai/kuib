// @context @journal/host-layer

import Config from "@kuib-ai/config";
import createDaemonServer from "../server";

const main = function (): void {
  const bootstrap = Config.bootstrapConfig();
  Config.ensureAppPaths(bootstrap.paths);
  const socketPath = bootstrap.paths.daemonSocket;
  const port = bootstrap.runtime.daemonPort;
  const server = createDaemonServer(socketPath, port);
  server.on("error", function () {
    return process.exit(0);
  });
  const tcpLine = port === undefined ? "" : ` + tcp :${port}`;
  process.stdout.write(`kuib daemon → ${socketPath}${tcpLine}\n`);
};

main();
