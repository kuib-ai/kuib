// @claim core/sqlite-writer
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
import Std from "@kuib-ai/std";
import initSchema from "../schema/index.ts";

const EPOCH = 0;

type NextSeqRow = { next: number };
type EnvelopeRow = { envelope: string };

// @claim core/sqlite-writer
const createSqliteEventLog = function (path: string): EventLogPort {
  const db = new DatabaseSync(path);
  initSchema(db);

  const subscribers = new Map<string, Set<EventHandler>>();

  const beginStmt = db.prepare("BEGIN IMMEDIATE");
  const commitStmt = db.prepare("COMMIT");
  const rollbackStmt = db.prepare("ROLLBACK");
  const nextSeqStmt = db.prepare(
    "SELECT COALESCE(MAX(seq), -1) + 1 AS next FROM events WHERE sessionID = ? AND epoch = ?",
  );
  const insertStmt = db.prepare(
    "INSERT INTO events (sessionID, epoch, seq, envelope, createdAt) VALUES (?, ?, ?, ?, ?)",
  );
  const replayStmt = db.prepare(
    "SELECT envelope FROM events WHERE sessionID = ? AND seq > ? ORDER BY epoch, seq",
  );

  const append = async function (
    sessionID: SessionID,
    originDeviceID: DeviceID,
    event: AnyEvent,
  ): Promise<EventEnvelope> {
    const write = function (): EventEnvelope {
      const row = nextSeqStmt.get(sessionID, EPOCH) as NextSeqRow | undefined;
      const seq = row?.next ?? 0;
      const createdAt = Date.now();
      const envelope = Protocol.Event.EventEnvelope.parse({
        _version: 1,
        epoch: EPOCH,
        seq,
        sessionID,
        originDeviceID,
        createdAt,
        event,
      });
      insertStmt.run(
        sessionID,
        EPOCH,
        seq,
        JSON.stringify(envelope),
        createdAt,
      );
      return envelope;
    };
    beginStmt.run();
    const [error, envelope] = Std.withError(write, function (cause) {
      return { cause };
    });
    if (error !== null) {
      rollbackStmt.run();
      throw error.cause;
    }
    commitStmt.run();

    const subs = subscribers.get(sessionID);
    if (subs) {
      for (const handler of subs) {
        handler(envelope);
      }
    }
    return envelope;
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
    if (afterSeq !== undefined) {
      replay(sessionID, afterSeq, handler);
    }
    const subs = subscribers.get(sessionID) ?? new Set<EventHandler>();
    subs.add(handler);
    subscribers.set(sessionID, subs);
    return function () {
      subs.delete(handler);
    };
  };

  return { append, replay, subscribe };
};

export default createSqliteEventLog;
