// @context @journal/host-layer
import Env from "@kuib-ai/env";
import createDaemonServer from "../server";
import resolveDaemonSocketPath from "../daemon.socket.path";

const main = function (): void {
  const env = Env.EnvSchema.parse(process.env);
  const socketPath = resolveDaemonSocketPath(env.KUIB_DAEMON_SOCKET);
  const port = env.KUIB_DAEMON_PORT;
  const server = createDaemonServer(socketPath, port);
  server.on("error", () => process.exit(0));
  const tcpLine = port === undefined ? "" : ` + tcp :${port}`;
  process.stdout.write(`kuib daemon → ${socketPath}${tcpLine}\n`);
};

main();
