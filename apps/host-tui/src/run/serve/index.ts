// @context @journal/host-layer

import Engine from "@kuib-ai/engine";
import EngineService from "@kuib-ai/engine-service";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import Std from "@kuib-ai/std";
import Telemetry from "@kuib-ai/telemetry";
import log from "../../log";
import resolveDaemonClient from "../../resolve.daemon.client";
import env from "../../env";

const serve = async function (
  dbPath: string,
  socketPath: string,
  deviceID: DeviceID,
  localLabel: string,
): Promise<void> {
  const serveLog = log.child({ command: "serve" });
  serveLog.info({ socketPath, deviceID, localLabel }, "engine serve starting");
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
    groqApiKey: env.KUIB_GROQ_API_KEY,
  });
  const model = Engine.Provider.createModel(modelConfig);
  const daemonClient = await resolveDaemonClient(env, localLabel);
  const eventLog = EventLogSqlite.createSqliteEventLog(dbPath);
  await EngineService.startEngineService({
    socketPath,
    eventLog,
    reapIdleMs: 5000,
    runTurn: ({ sessionID: sid, prompt, takePending }) =>
      Std.withScope({ sessionID: sid, deviceID }, () => {
        serveLog.info("turn starting");
        return Engine.runAgent({
          prompt,
          sessionID: sid,
          deviceID,
          model,
          daemonClient,
          eventLog,
          takePending,
        });
      }),
  });
};

export default serve;
