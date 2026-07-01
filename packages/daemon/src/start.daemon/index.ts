// @context @journal/host-layer
import createDaemonServer from "../server";
import resolveDaemonSocketPath from "../daemon.socket.path";

const main = function (): void {
  const socketPath = resolveDaemonSocketPath(process.env["KUIB_DAEMON_SOCKET"]);
  const portValue = process.env["KUIB_DAEMON_PORT"];
  const port = portValue === undefined ? undefined : Number(portValue);
  const server = createDaemonServer(socketPath, port);
  server.on("error", () => process.exit(0));
  const tcpLine = port === undefined ? "" : ` + tcp :${port}`;
  process.stdout.write(`kuib daemon → ${socketPath}${tcpLine}\n`);
};

main();
