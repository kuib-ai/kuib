// @context @journal/host-layer

import Engine from "@kuib-ai/engine";
import EngineService from "@kuib-ai/engine-service";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import type { BootstrapConfig } from "@kuib-ai/config/bootstrap.config";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import Std from "@kuib-ai/std";
import Telemetry from "@kuib-ai/telemetry";
import type createLog from "../../log";
import resolveDaemonClient from "../../resolve.daemon.client";

const serve = async function (
  bootstrap: BootstrapConfig,
  deviceID: DeviceID,
  log: ReturnType<typeof createLog>,
): Promise<void> {
  const dbPath = bootstrap.paths.database;
  const socketPath = bootstrap.paths.engineSocket;
  const localLabel = bootstrap.config.node.label;
  const serveLog = log.child({ command: "serve" });
  serveLog.info({ socketPath, deviceID, localLabel }, "engine serve starting");
  Telemetry.startTelemetry({
    endpoint: bootstrap.config.telemetry.endpoint,
    serviceName: "kuib-engine",
  });
  const modelConfig = Engine.Provider.resolveModelConfig({
    model: bootstrap.config.model.default,
    baseURL: bootstrap.config.model.baseURL,
    apiKey: bootstrap.secrets.modelApiKey,
    anthropicApiKey: bootstrap.secrets.anthropicApiKey,
    groqApiKey: bootstrap.secrets.groqApiKey,
  });
  const model = Engine.Provider.createModel(modelConfig);
  const daemonClient = await resolveDaemonClient(
    {
      targetNode: bootstrap.config.target.node,
      meshConfigFile: bootstrap.paths.meshConfigFile,
      daemonURL: bootstrap.runtime.daemonURL,
      daemonSocket: bootstrap.paths.daemonSocket,
    },
    localLabel,
  );
  const eventLog = EventLogSqlite.createSqliteEventLog(dbPath);
  await EngineService.startEngineService({
    socketPath,
    eventLog,
    reapIdleMs: 5000,
    runTurn: function ({ sessionID: sid, prompt, takePending }) {
      return Std.withScope({ sessionID: sid, deviceID }, function () {
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
      });
    },
  });
};

export default serve;
