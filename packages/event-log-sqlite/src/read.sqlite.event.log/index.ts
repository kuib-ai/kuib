// @context @journal/domains/core#^C022
import { DatabaseSync } from "node:sqlite";
import Protocol from "@kuib-ai/protocol";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import type {
  EventLogPort,
  EventHandler,
} from "@kuib-ai/protocol/event.log.port";

const DEFAULT_POLL_MS = 150;

type EnvelopeRow = { envelope: string };
type TailRow = { rowid: number; envelope: string };
type MaxRowidRow = { max: number };
type FloorRow = { floor: number };

const createSqliteReader = function (
  path: string,
  pollIntervalMs: number = DEFAULT_POLL_MS,
): EventLogPort {
  const db = new DatabaseSync(path, { readOnly: true });

  const replayStmt = db.prepare(
    "SELECT envelope FROM events WHERE sessionID = ? AND seq > ? ORDER BY epoch, seq",
  );
  const tailStmt = db.prepare(
    "SELECT rowid AS rowid, envelope FROM events WHERE sessionID = ? AND rowid > ? ORDER BY rowid",
  );
  const floorStmt = db.prepare(
    "SELECT COALESCE(MAX(rowid), 0) AS floor FROM events WHERE sessionID = ? AND seq <= ?",
  );
  const maxRowidStmt = db.prepare(
    "SELECT COALESCE(MAX(rowid), 0) AS max FROM events WHERE sessionID = ?",
  );

  const append = function (
    _sessionID: SessionID,
    _originDeviceID: DeviceID,
    _event: AnyEvent,
  ): Promise<EventEnvelope> {
    return Promise.reject(
      new Error("createSqliteReader is read-only: append is not supported"),
    );
  };

  const replay = function (
    sessionID: SessionID,
    afterSeq: number,
    handler: EventHandler,
  ): void {
    const rows = replayStmt.all(sessionID, afterSeq) as EnvelopeRow[];
    for (const row of rows) {
      handler(Protocol.Event.EventEnvelope.parse(JSON.parse(row.envelope)));
    }
  };

  const subscribe = function (
    sessionID: SessionID,
    handler: EventHandler,
    afterSeq?: number,
  ): () => void {
    const cursorRow =
      afterSeq === undefined
        ? (maxRowidStmt.get(sessionID) as MaxRowidRow | undefined)?.max
        : (floorStmt.get(sessionID, afterSeq) as FloorRow | undefined)?.floor;
    let rowidCursor = cursorRow ?? 0;

    const drain = function (): void {
      const rows = tailStmt.all(sessionID, rowidCursor) as TailRow[];
      for (const row of rows) {
        handler(Protocol.Event.EventEnvelope.parse(JSON.parse(row.envelope)));
        rowidCursor = row.rowid;
      }
    };

    if (afterSeq !== undefined) {
      drain();
    }
    const timer = setInterval(drain, pollIntervalMs);
    return function () {
      clearInterval(timer);
    };
  };

  return { append, replay, subscribe };
};

export default createSqliteReader;
