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
import initSchema from "../schema";

const EPOCH = 0;

const createSqliteEventLog = function (path: string): EventLogPort {
  const db = new Database(path, { create: true });
  initSchema(db);

  const subscribers = new Map<string, Set<EventHandler>>();

  const nextSeqStmt = db.query<{ next: number }, [string, number]>(
    "SELECT COALESCE(MAX(seq), -1) + 1 AS next FROM events WHERE sessionID = ? AND epoch = ?",
  );
  const insertStmt = db.query<
    unknown,
    [string, number, number, string, number]
  >(
    "INSERT INTO events (sessionID, epoch, seq, envelope, createdAt) VALUES (?, ?, ?, ?, ?)",
  );
  const replayStmt = db.query<{ envelope: string }, [string, number]>(
    "SELECT envelope FROM events WHERE sessionID = ? AND seq > ? ORDER BY epoch, seq",
  );

  const append = async function (
    sessionID: SessionID,
    originDeviceID: DeviceID,
    event: AnyEvent,
  ): Promise<EventEnvelope> {
    const commit = db.transaction((): EventEnvelope => {
      const row = nextSeqStmt.get(sessionID, EPOCH);
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
    });
    const envelope = commit.immediate();

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
    for (const row of replayStmt.all(sessionID, afterSeq)) {
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
