// @context @journal/host-layer
import EngineService from "@kuib-ai/engine-service";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import Protocol from "@kuib-ai/protocol";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import Std from "@kuib-ai/std";
import { render } from "@opentui/solid";
import App from "../../app";
import type createLog from "../../log";

const ui = async function (
  dbPath: string,
  socketPath: string,
  sessionID: SessionID,
  deviceLabel: string,
  spawnArgv: string[],
  log: ReturnType<typeof createLog>,
): Promise<void> {
  const uiLog = log.child({ command: "ui" });
  uiLog.info({ socketPath, sessionID, deviceLabel }, "tui starting");
  const client = await EngineService.connectOrSpawn({
    socketPath,
    spawnArgv,
  });
  const eventLog = EventLogSqlite.createSqliteReader(dbPath);
  const onSubmit = function (prompt: string): void {
    void Std.withScope({ sessionID }, async () => {
      const [cause] = await Std.withError(
        client.submit({
          type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
          sessionID,
          prompt,
        }),
      );
      if (cause !== null) {
        uiLog.error(Std.errorFields(cause), "submit failed");
      }
    });
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

export default ui;
