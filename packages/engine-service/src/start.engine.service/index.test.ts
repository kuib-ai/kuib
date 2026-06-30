// @context @journal/host-layer
import { test, expect, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import Std from "@kuib-ai/std";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import startEngineService from "./index";
import connectOrSpawn from "../engine.client";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");
const startedEvent: AnyEvent = {
  type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
  messageID,
};

const paths: string[] = [];

const dbPath = function (slug: string): string {
  const p = join(tmpdir(), `kuib-es-${slug}.db`);
  paths.push(p);
  paths.push(`${p}-wal`);
  paths.push(`${p}-shm`);
  return p;
};

const sockPath = function (slug: string): string {
  const p = join(tmpdir(), `kuib-es-${slug}.sock`);
  paths.push(p);
  return p;
};

afterAll(() => {
  for (const p of paths) {
    if (existsSync(p)) {
      rmSync(p, { force: true });
    }
  }
});

const makeSlowModel = function (): MockLanguageModelV3 {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: 20,
        chunkDelayInMs: 40,
        chunks: [
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: "a" },
          { type: "text-delta", id: "t1", delta: "b" },
          { type: "text-delta", id: "t1", delta: "c" },
          { type: "text-delta", id: "t1", delta: "d" },
          { type: "text-end", id: "t1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: {
              inputTokens: {
                total: 1,
                noCache: 1,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: 4, text: 4, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
};

const makeRunTurn = function (eventLog: EventLogPort) {
  const model = makeSlowModel();
  const daemonClient =
    Engine.DaemonClient.createDaemonClient("http://localhost:1");
  return function (input: {
    sessionID: SessionID;
    prompt: string;
  }): Promise<void> {
    return Engine.runAgent({
      prompt: input.prompt,
      sessionID: input.sessionID,
      deviceID,
      model,
      daemonClient,
      eventLog,
    });
  };
};

const maxSeq = function (log: EventLogPort, sid: SessionID): number {
  let m = -1;
  log.replay(sid, -1, (e) => {
    m = e.seq;
  });
  return m;
};

const hasCompleted = function (log: EventLogPort, sid: SessionID): boolean {
  let found = false;
  log.replay(sid, -1, (e) => {
    if (e.event.type === Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED) {
      found = true;
    }
  });
  return found;
};

const waitUntil = function (
  pred: () => boolean,
  timeoutMs: number,
  stepMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const step = function (): Promise<void> {
    if (pred()) {
      return Promise.resolve();
    }
    if (Date.now() >= deadline) {
      return Promise.reject(new Error("waitUntil timed out"));
    }
    return new Promise<void>((r) => setTimeout(r, stepMs)).then(step);
  };
  return step();
};

const sleep = function (ms: number): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
};

test("survive-detach: log keeps growing after client disconnects mid-stream", async () => {
  const db = dbPath("survive-detach");
  const sock = sockPath("survive-detach");
  const eventLog = EventLogSqlite.createSqliteEventLog(db);
  const handle = await startEngineService({
    socketPath: sock,
    eventLog,
    runTurn: makeRunTurn(eventLog),
    reapIdleMs: 10000,
  });

  const c = await connectOrSpawn({
    socketPath: sock,
    spawnArgv: ["__unused__"],
  });
  await c.submit({
    type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
    sessionID,
    prompt: "go",
  });

  await waitUntil(() => maxSeq(eventLog, sessionID) >= 1, 2000, 20);
  const seqAtDisconnect = maxSeq(eventLog, sessionID);
  c.close();

  await waitUntil(() => hasCompleted(eventLog, sessionID), 5000, 25);
  expect(hasCompleted(eventLog, sessionID)).toBe(true);
  expect(maxSeq(eventLog, sessionID)).toBeGreaterThan(seqAtDisconnect);

  await handle.close();
});

test("reap: idle reaps, attached/active blocks reap", async () => {
  const sockIdle = sockPath("reap-idle");
  const dbIdle = dbPath("reap-idle");
  const idleLog = EventLogSqlite.createSqliteEventLog(dbIdle);
  await startEngineService({
    socketPath: sockIdle,
    eventLog: idleLog,
    runTurn: makeRunTurn(idleLog),
    reapIdleMs: 30,
  });
  await waitUntil(() => !existsSync(sockIdle), 1000, 10);
  expect(existsSync(sockIdle)).toBe(false);

  const sockConn = sockPath("reap-conn");
  const dbConn = dbPath("reap-conn");
  const connLog = EventLogSqlite.createSqliteEventLog(dbConn);
  await startEngineService({
    socketPath: sockConn,
    eventLog: connLog,
    runTurn: makeRunTurn(connLog),
    reapIdleMs: 30,
  });
  const c = await connectOrSpawn({
    socketPath: sockConn,
    spawnArgv: ["__unused__"],
  });
  await sleep(200);
  expect(existsSync(sockConn)).toBe(true);
  c.close();
  await waitUntil(() => !existsSync(sockConn), 1000, 10);
  expect(existsSync(sockConn)).toBe(false);

  const sockRun = sockPath("reap-run");
  const dbRun = dbPath("reap-run");
  const runLog = EventLogSqlite.createSqliteEventLog(dbRun);
  await startEngineService({
    socketPath: sockRun,
    eventLog: runLog,
    runTurn: makeRunTurn(runLog),
    reapIdleMs: 30,
  });
  const cr = await connectOrSpawn({
    socketPath: sockRun,
    spawnArgv: ["__unused__"],
  });
  await cr.submit({
    type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
    sessionID,
    prompt: "go",
  });
  await waitUntil(() => maxSeq(runLog, sessionID) >= 1, 2000, 20);
  cr.close();
  await sleep(100);
  expect(existsSync(sockRun)).toBe(true);
  await waitUntil(() => !existsSync(sockRun), 5000, 25);
  expect(existsSync(sockRun)).toBe(false);
});

test("single-instance: second bind rejects EADDRINUSE; connectOrSpawn connects without spawning", async () => {
  const db = dbPath("single");
  const sock = sockPath("single");
  const eventLog = EventLogSqlite.createSqliteEventLog(db);
  const handle = await startEngineService({
    socketPath: sock,
    eventLog,
    runTurn: makeRunTurn(eventLog),
    reapIdleMs: 10000,
  });

  const [err] = await Std.asyncWithError(
    startEngineService({
      socketPath: sock,
      eventLog,
      runTurn: makeRunTurn(eventLog),
      reapIdleMs: 10000,
    }),
  );
  expect(err).not.toBeNull();
  expect((err as { code?: string }).code).toBe("EADDRINUSE");

  const sentinel = join(tmpdir(), "kuib-es-single-sentinel.txt");
  paths.push(sentinel);
  rmSync(sentinel, { force: true });
  const c = await connectOrSpawn({
    socketPath: sock,
    spawnArgv: [
      "-e",
      `require('fs').writeFileSync(${JSON.stringify(sentinel)}, 'x')`,
    ],
  });
  expect(existsSync(sentinel)).toBe(false);
  await c.submit({
    type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
    sessionID,
    prompt: "x",
  });
  c.close();
  await handle.close();
});

test("resume-from-cursor + reader: replay after seq yields the tail; subscribe replays all then polls new appends", async () => {
  const db = dbPath("resume-cursor");
  const writer = EventLogSqlite.createSqliteEventLog(db);
  for (let i = 0; i < 5; i++) {
    await writer.append(sessionID, deviceID, startedEvent);
  }

  const reader = EventLogSqlite.createSqliteReader(db, 25);

  const replayed: number[] = [];
  reader.replay(sessionID, 2, (e) => replayed.push(e.seq));
  expect(replayed).toEqual([3, 4]);

  const seen: number[] = [];
  const unsub = reader.subscribe(sessionID, (e) => seen.push(e.seq), -1);
  expect(seen).toEqual([0, 1, 2, 3, 4]);

  await writer.append(sessionID, deviceID, startedEvent);
  await writer.append(sessionID, deviceID, startedEvent);
  await waitUntil(() => seen.length === 7, 2000, 25);
  expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6]);

  unsub();
  await sleep(100);
  expect(seen.length).toBe(7);
});

test("WAL concurrency: reader observes monotonic (epoch, seq) with no missing rows while writer writes", async () => {
  const db = dbPath("wal-concurrency");
  const writer = EventLogSqlite.createSqliteEventLog(db);
  writer.replay(sessionID, -1, () => {});

  const reader = EventLogSqlite.createSqliteReader(db, 20);
  const seen: number[] = [];
  const unsub = reader.subscribe(sessionID, (e) => seen.push(e.seq));

  const total = 30;
  for (let i = 0; i < total; i++) {
    await writer.append(sessionID, deviceID, startedEvent);
    await sleep(5);
  }

  await waitUntil(() => seen.length === total, 5000, 20);
  expect(seen).toEqual([...Array(total).keys()]);
  unsub();
});
