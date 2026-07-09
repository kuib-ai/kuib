// @context @journal/host-layer

import createDaemonServer from "../server";
import env from "../env";

const main = function (): void {
  const socketPath = env.KUIB_DAEMON_SOCKET;
  const port = env.KUIB_DAEMON_PORT;
  const server = createDaemonServer(socketPath, port);
  server.on("error", () => process.exit(0));
  const tcpLine = port === undefined ? "" : ` + tcp :${port}`;
  process.stdout.write(`kuib daemon → ${socketPath}${tcpLine}\n`);
};

main();
