// @context @journal/protocol-design
import { Database } from "bun:sqlite";
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

const createSqliteReader = function (
  path: string,
  pollIntervalMs: number = DEFAULT_POLL_MS,
): EventLogPort {
  const db = new Database(path, { readonly: true });

  const replayStmt = db.query<{ envelope: string }, [string, number]>(
    "SELECT envelope FROM events WHERE sessionID = ? AND seq > ? ORDER BY epoch, seq",
  );
  const tailStmt = db.query<
    { rowid: number; envelope: string },
    [string, number]
  >(
    "SELECT rowid AS rowid, envelope FROM events WHERE sessionID = ? AND rowid > ? ORDER BY rowid",
  );
  const floorStmt = db.query<{ floor: number }, [string, number]>(
    "SELECT COALESCE(MAX(rowid), 0) AS floor FROM events WHERE sessionID = ? AND seq <= ?",
  );
  const maxRowidStmt = db.query<{ max: number }, [string]>(
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
    for (const row of replayStmt.all(sessionID, afterSeq)) {
      handler(Protocol.Event.EventEnvelope.parse(JSON.parse(row.envelope)));
    }
  };

  const subscribe = function (
    sessionID: SessionID,
    handler: EventHandler,
    afterSeq?: number,
  ): () => void {
    let rowidCursor =
      afterSeq === undefined
        ? (maxRowidStmt.get(sessionID)?.max ?? 0)
        : (floorStmt.get(sessionID, afterSeq)?.floor ?? 0);

    const drain = function (): void {
      for (const row of tailStmt.all(sessionID, rowidCursor)) {
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
