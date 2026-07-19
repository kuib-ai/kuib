// @context @journal/host-layer
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROBE_TIMEOUT_MS = 5000;
const PROBE_INTERVAL_MS = 50;

const probe = function (socketPath: string): Promise<boolean> {
  return new Promise<boolean>(function (resolve) {
    const socket = net.connect(socketPath);
    socket.once("connect", function () {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", function () {
      socket.destroy();
      resolve(false);
    });
  });
};

const sleep = function (ms: number): Promise<void> {
  return new Promise<void>(function (resolve) {
    return setTimeout(resolve, ms);
  });
};

const ensureDaemon = async function (socketPath: string): Promise<void> {
  if (await probe(socketPath)) {
    return;
  }
  const entry = fileURLToPath(
    new URL("../start.daemon/index.ts", import.meta.url),
  );
  const child = spawn(process.execPath, [entry], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, KUIB_DAEMON_SOCKET: socketPath },
  });
  child.unref();

  const deadline = Date.now() + PROBE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await probe(socketPath)) {
      return;
    }
    await sleep(PROBE_INTERVAL_MS);
  }
  throw new Error(`daemon did not become reachable at ${socketPath}`);
};

export default ensureDaemon;
