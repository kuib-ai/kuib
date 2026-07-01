// @context @journal/host-layer
import net from "node:net";
import { unlinkSync } from "node:fs";
import Std from "@kuib-ai/std";
import Protocol from "@kuib-ai/protocol";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";

type RunTurn = (input: {
  sessionID: SessionID;
  prompt: string;
  takePending: () => string[];
}) => Promise<void>;

type SessionTurnState = {
  running: boolean;
  pending: string[];
};

type StartEngineServiceParams = {
  socketPath: string;
  eventLog: EventLogPort;
  runTurn: RunTurn;
  reapIdleMs?: number;
};

type EngineServiceHandle = {
  close: () => Promise<void>;
};

const DEFAULT_REAP_IDLE_MS = 5000;

const startEngineService = function (
  params: StartEngineServiceParams,
): Promise<EngineServiceHandle> {
  const reapIdleMs = params.reapIdleMs ?? DEFAULT_REAP_IDLE_MS;
  const server = net.createServer();

  const sockets = new Set<net.Socket>();
  const sessions = new Map<string, SessionTurnState>();
  let attachedConnections = 0;
  let activeRuns = 0;
  let reapTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const clearReapTimer = function (): void {
    if (reapTimer !== null) {
      clearTimeout(reapTimer);
      reapTimer = null;
    }
  };

  const doClose = async function (): Promise<void> {
    if (closed) {
      return;
    }
    closed = true;
    clearReapTimer();
    for (const socket of sockets) {
      socket.destroy();
    }
    sockets.clear();
    await new Promise<void>((res) => server.close(() => res()));
    await Std.asyncWithError(
      Promise.resolve().then(() => unlinkSync(params.socketPath)),
    );
  };

  const reap = function (): void {
    reapTimer = null;
    if (activeRuns !== 0 || attachedConnections !== 0) {
      return;
    }
    setImmediate(() => {
      if (closed || activeRuns !== 0 || attachedConnections !== 0) {
        return;
      }
      void doClose();
    });
  };

  const maybeReap = function (): void {
    if (closed) {
      clearReapTimer();
      return;
    }
    if (activeRuns === 0 && attachedConnections === 0) {
      clearReapTimer();
      reapTimer = setTimeout(reap, reapIdleMs);
      return;
    }
    clearReapTimer();
  };

  const handleFrame = async function (line: string): Promise<void> {
    const [parseErr, raw] = await Std.asyncWithError(
      Promise.resolve().then(() => JSON.parse(line)),
    );
    if (parseErr) {
      return;
    }
    const decoded = Protocol.ServiceMessage.ServiceMessageAny.safeParse(raw);
    if (!decoded.success) {
      return;
    }
    const msg = decoded.data;
    if (msg.type === Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT) {
      const state = sessions.get(msg.sessionID) ?? {
        running: false,
        pending: [],
      };
      sessions.set(msg.sessionID, state);
      if (state.running) {
        state.pending.push(msg.prompt);
        return;
      }
      state.running = true;
      activeRuns++;
      clearReapTimer();
      let prompt: string | undefined = msg.prompt;
      while (prompt !== undefined) {
        const [runErr] = await Std.asyncWithError(
          params.runTurn({
            sessionID: msg.sessionID,
            prompt,
            takePending: () => state.pending.splice(0),
          }),
        );
        void runErr;
        prompt = state.pending.shift();
      }
      state.running = false;
      activeRuns--;
      maybeReap();
    }
  };

  const onConnection = function (socket: net.Socket): void {
    if (closed) {
      socket.destroy();
      return;
    }
    sockets.add(socket);
    attachedConnections++;
    clearReapTimer();
    let buf = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (line.length > 0) {
          void handleFrame(line);
        }
      }
    });
    socket.on("close", () => {
      sockets.delete(socket);
      attachedConnections--;
      maybeReap();
    });
    socket.on("error", () => {});
  };

  return new Promise<EngineServiceHandle>((resolve, reject) => {
    const onError = async function (err: NodeJS.ErrnoException): Promise<void> {
      if (err.code === "EADDRINUSE") {
        const probe = net.connect(params.socketPath);
        probe.once("connect", () => {
          probe.destroy();
          const bindErr: NodeJS.ErrnoException = new Error(
            `engine-service already running at ${params.socketPath}`,
          );
          bindErr.code = "EADDRINUSE";
          reject(bindErr);
        });
        probe.once("error", () => {
          void (async () => {
            await Std.asyncWithError(
              Promise.resolve().then(() => unlinkSync(params.socketPath)),
            );
            server.listen(params.socketPath);
          })();
        });
        return;
      }
      reject(err);
    };

    server.on("error", (err: NodeJS.ErrnoException) => {
      void onError(err);
    });
    server.on("connection", onConnection);
    server.listen(params.socketPath, () => {
      server.removeAllListeners("error");
      server.on("error", () => {});
      maybeReap();
      resolve({ close: doClose });
    });
  });
};

export default startEngineService;
export type { StartEngineServiceParams, EngineServiceHandle, RunTurn };
