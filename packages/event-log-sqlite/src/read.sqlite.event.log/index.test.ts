// @context @journal/protocol-design
import { test, expect, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import Protocol from "@kuib-ai/protocol";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import createSqliteEventLog from "../sqlite.event.log";
import createSqliteReader from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");
const event: AnyEvent = {
  type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
  messageID,
};

const paths: string[] = [];
const dbPath = function (slug: string): string {
  const p = join(tmpdir(), `kuib-reader-${slug}.db`);
  paths.push(p);
  return p;
};

const waitUntil = function (
  pred: () => boolean,
  timeoutMs: number,
  stepMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const tick = function (
    resolve: () => void,
    reject: (e: Error) => void,
  ): void {
    if (pred()) {
      resolve();
      return;
    }
    if (Date.now() > deadline) {
      reject(new Error("waitUntil timed out"));
      return;
    }
    setTimeout(() => tick(resolve, reject), stepMs);
  };
  return new Promise<void>((resolve, reject) => tick(resolve, reject));
};

afterAll(() => {
  for (const p of paths) {
    rmSync(p, { force: true });
    rmSync(`${p}-wal`, { force: true });
    rmSync(`${p}-shm`, { force: true });
  }
});

test("replay yields only rows after the cursor and subscribe sees new appends", async () => {
  const path = dbPath("resume");
  const writer = createSqliteEventLog(path);
  for (let i = 0; i < 5; i++) {
    await writer.append(sessionID, deviceID, event);
  }
  expect(existsSync(path)).toBe(true);

  const reader = createSqliteReader(path);

  const replayed: number[] = [];
  reader.replay(sessionID, 2, (e) => replayed.push(e.seq));
  expect(replayed).toEqual([3, 4]);

  const seen: number[] = [];
  const unsub = reader.subscribe(sessionID, (e) => seen.push(e.seq), -1);
  expect(seen).toEqual([0, 1, 2, 3, 4]);

  await writer.append(sessionID, deviceID, event);
  await writer.append(sessionID, deviceID, event);
  await waitUntil(() => seen.length === 7, 2000, 25);
  expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6]);

  unsub();
  await new Promise((r) => setTimeout(r, 100));
  expect(seen.length).toBe(7);
});

test("reader sees all rows monotonically under concurrent WAL writes", async () => {
  const path = dbPath("wal");
  const writer = createSqliteEventLog(path);
  writer.replay(sessionID, -1, () => {});

  const reader = createSqliteReader(path, 20);
  const seen: number[] = [];
  const unsub = reader.subscribe(sessionID, (e) => seen.push(e.seq));

  const K = 30;
  for (let i = 0; i < K; i++) {
    await writer.append(sessionID, deviceID, event);
    await new Promise((r) => setTimeout(r, 5));
  }

  await waitUntil(() => seen.length === K, 5000, 20);
  expect(seen).toEqual([...Array(K).keys()]);
  unsub();
});
