// @context @journal/host-layer
import { dirname, join } from "node:path";
import { render } from "@opentui/solid";

import Protocol from "@kuib-ai/protocol";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import Engine from "@kuib-ai/engine";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import EngineService from "@kuib-ai/engine-service";
import Telemetry from "@kuib-ai/telemetry";
import Cli, { type CliSchema } from "@kuib-ai/cli";

import App from "./app";
import resolveDaemonClient from "./resolve.daemon.client";
import env from "./env";

const cliSchema: CliSchema = {
  description: "Kuib AI Terminal Interface",
  options: {},
};

const runServe = async function (
  dbPath: string,
  socketPath: string,
  deviceID: DeviceID,
  localLabel: string,
): Promise<void> {
  Telemetry.startTelemetry({
    endpoint: env.KUIB_TRACE_ENDPOINT,
    serviceName: env.KUIB_TRACE_SERVICE,
  });
  const modelConfig = Engine.Provider.resolveModelConfig({
    model: env.KUIB_MODEL,
    baseURL: env.KUIB_MODEL_BASE_URL,
    apiKey: env.KUIB_MODEL_API_KEY,
    modelID: env.KUIB_MODEL_ID,
    anthropicApiKey: env.KUIB_ANTHROPIC_API_KEY,
  });
  const model = Engine.Provider.createModel(modelConfig);
  const daemonClient = await resolveDaemonClient(env, localLabel);
  const eventLog = EventLogSqlite.createSqliteEventLog(dbPath);
  await EngineService.startEngineService({
    socketPath,
    eventLog,
    reapIdleMs: 5000,
    runTurn: ({ sessionID: sid, prompt, takePending }) =>
      Engine.runAgent({
        prompt,
        sessionID: sid,
        deviceID,
        model,
        daemonClient,
        eventLog,
        takePending,
      }),
  });
};

const runUi = async function (
  dbPath: string,
  socketPath: string,
  sessionID: SessionID,
  deviceLabel: string,
): Promise<void> {
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
    () => (
      <App
        eventLog={eventLog}
        sessionID={sessionID}
        deviceLabel={deviceLabel}
        onSubmit={onSubmit}
      />
    ),
    { exitOnCtrlC: true, onDestroy: () => process.exit(0) },
  );
};

const main = async function (): Promise<void> {
  const parsed = Cli.parseCli("kuib", cliSchema);
  if (parsed === null) {
    return;
  }

  const dbPath = env.KUIB_DB_PATH;
  const socketPath = join(dirname(dbPath), "engine.sock");
  const sessionID = Protocol.ID.SessionID.parse(env.KUIB_SESSION_ID);
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());
  const localLabel = env.KUIB_NODE_LABEL;
  const deviceLabel = env.KUIB_TARGET_NODE ?? localLabel;

  const command = parsed.positionals[0] ?? "ui";

  switch (command) {
    case "serve":
      return runServe(dbPath, socketPath, deviceID, localLabel);
    case "ui":
      return runUi(dbPath, socketPath, sessionID, deviceLabel);
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.exit(1);
  }
};

void main().catch((error: Error) => {
  process.stderr.write(`kuib failed to start: ${error.message}\n`);
  process.exit(1);
});
