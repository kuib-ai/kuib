// @context @journal/host-layer
import net from "node:net";
import { spawn } from "node:child_process";
import type { SubmitMessage } from "@kuib-ai/protocol/service.message/submit.message";

type ConnectOrSpawnParams = {
  socketPath: string;
  spawnArgv: string[];
  connectTimeoutMs?: number;
  connectIntervalMs?: number;
};

type EngineServiceClient = {
  submit: (msg: SubmitMessage) => Promise<void>;
  close: () => void;
};

const DEFAULT_CONNECT_TIMEOUT_MS = 5000;
const DEFAULT_CONNECT_INTERVAL_MS = 50;

const tryConnect = function (socketPath: string): Promise<net.Socket | null> {
  return new Promise<net.Socket | null>((resolve) => {
    const socket = net.connect(socketPath);
    socket.once("connect", () => {
      socket.removeAllListeners("error");
      socket.on("error", () => {});
      resolve(socket);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(null);
    });
  });
};

const wrap = function (socket: net.Socket): EngineServiceClient {
  const submit = function (msg: SubmitMessage): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      socket.write(JSON.stringify(msg) + "\n", (err) =>
        err ? reject(err) : resolve(),
      );
    });
  };
  const close = function (): void {
    socket.end();
  };
  return { submit, close };
};

const sleep = function (ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

const connectOrSpawn = function (
  params: ConnectOrSpawnParams,
): Promise<EngineServiceClient> {
  const connectTimeoutMs =
    params.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  const connectIntervalMs =
    params.connectIntervalMs ?? DEFAULT_CONNECT_INTERVAL_MS;

  return tryConnect(params.socketPath).then((existing) => {
    if (existing !== null) {
      return wrap(existing);
    }
    const child = spawn(process.execPath, params.spawnArgv, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    const deadline = Date.now() + connectTimeoutMs;
    const poll = function (): Promise<EngineServiceClient> {
      return tryConnect(params.socketPath).then((socket) => {
        if (socket !== null) {
          return wrap(socket);
        }
        if (Date.now() >= deadline) {
          return Promise.reject(
            new Error("engine-service did not become reachable"),
          );
        }
        return sleep(connectIntervalMs).then(poll);
      });
    };
    return poll();
  });
};

export default connectOrSpawn;
export type { ConnectOrSpawnParams, EngineServiceClient };
