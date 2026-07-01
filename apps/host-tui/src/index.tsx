// @context @journal/host-layer
import { dirname, join } from "node:path";
import { render } from "@opentui/solid";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import Daemon from "@kuib-ai/daemon";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import EngineService from "@kuib-ai/engine-service";
import Env from "@kuib-ai/env";
import App from "./app";

const main = async function (): Promise<void> {
  const env = Env.bootstrapEnv();
  const argv = process.argv.slice(2);
  const dbPath = Env.resolveDbPath(env.KUIB_DB_PATH);
  const socketPath = join(dirname(dbPath), "engine.sock");
  const sessionID = Protocol.ID.SessionID.parse(env.KUIB_SESSION_ID);
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());

  if (argv.includes("serve")) {
    const model = Engine.Provider.createModel({
      baseURL: env.KUIB_MODEL_BASE_URL,
      apiKey: env.KUIB_MODEL_API_KEY,
      modelID: env.KUIB_MODEL_ID,
    });
    const daemonSocket = Daemon.resolveDaemonSocketPath(env.KUIB_DAEMON_SOCKET);
    await Daemon.ensureDaemon(daemonSocket);
    const daemonClient = Engine.DaemonClient.createDaemonClient(daemonSocket);
    const eventLog = EventLogSqlite.createSqliteEventLog(dbPath);
    await EngineService.startEngineService({
      socketPath,
      eventLog,
      reapIdleMs: 5000,
      runTurn: ({ sessionID: sid, prompt }) =>
        Engine.runAgent({
          prompt,
          sessionID: sid,
          deviceID,
          model,
          daemonClient,
          eventLog,
        }),
    });
    return;
  }

  const client = await EngineService.connectOrSpawn({
    socketPath,
    spawnArgv: [process.argv[1] ?? "", "serve"],
  });
  const eventLog = EventLogSqlite.createSqliteReader(dbPath);
  const onSubmit = function (prompt: string): void {
    void client
      .submit({
        type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
        sessionID,
        prompt,
      })
      .catch(() => {});
  };

  render(
    () => <App eventLog={eventLog} sessionID={sessionID} onSubmit={onSubmit} />,
    { exitOnCtrlC: true, onDestroy: () => process.exit(0) },
  );
};

void main();
