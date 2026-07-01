// @context @journal/host-layer
import createDaemonServer from "../server";
import resolveDaemonSocketPath from "../daemon.socket.path";

const main = function (): void {
  const socketPath = resolveDaemonSocketPath(process.env["KUIB_DAEMON_SOCKET"]);
  const server = createDaemonServer(socketPath);
  server.on("error", () => process.exit(0));
  process.stdout.write(`kuib daemon → ${socketPath}\n`);
};

main();
