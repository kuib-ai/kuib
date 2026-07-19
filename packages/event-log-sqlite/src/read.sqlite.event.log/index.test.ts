// @context @journal/protocol-design
import { describe, it, expect, afterAll } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
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

const POLL_MS = 15;

const paths: string[] = [];
const dbPath = function (slug: string): string {
  const p = join(tmpdir(), `kuib-reader-${process.pid}-${slug}.db`);
  paths.push(p);
  return p;
};

const wait = function (ms: number): Promise<void> {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
};

const waitUntil = function (
  pred: () => boolean,
  timeoutMs: number,
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
    setTimeout(function () {
      return tick(resolve, reject);
    }, POLL_MS);
  };
  return new Promise<void>(function (resolve, reject) {
    return tick(resolve, reject);
  });
};

afterAll(function () {
  for (const p of paths) {
    rmSync(p, { force: true });
    rmSync(`${p}-wal`, { force: true });
    rmSync(`${p}-shm`, { force: true });
  }
});

describe("read sqlite event log", function () {
  it("rejects append with a read-only error", async function () {
    const path = dbPath("readonly");
    createSqliteEventLog(path);
    const reader = createSqliteReader(path, POLL_MS);
    await expect(reader.append(sessionID, deviceID, event)).rejects.toThrow(
      "read-only",
    );
  });

  it("subscribe without afterSeq only delivers events appended after subscription", async function () {
    const path = dbPath("tail-only");
    const writer = createSqliteEventLog(path);
    await writer.append(sessionID, deviceID, event);
    await writer.append(sessionID, deviceID, event);

    const reader = createSqliteReader(path, POLL_MS);
    const seen: number[] = [];
    const cancel = reader.subscribe(sessionID, function (e) {
      return seen.push(e.seq);
    });
    await writer.append(sessionID, deviceID, event);
    await waitUntil(function () {
      return seen.length === 1;
    }, 2000);
    cancel();

    expect(seen).toEqual([2]);
  });

  it("subscribe with afterSeq replays from floor then tails new rows", async function () {
    const path = dbPath("replay-then-tail");
    const writer = createSqliteEventLog(path);
    await writer.append(sessionID, deviceID, event);
    await writer.append(sessionID, deviceID, event);

    const reader = createSqliteReader(path, POLL_MS);
    const seen: number[] = [];
    const cancel = reader.subscribe(
      sessionID,
      function (e) {
        return seen.push(e.seq);
      },
      0,
    );
    expect(seen).toEqual([1]);

    await writer.append(sessionID, deviceID, event);
    await waitUntil(function () {
      return seen.length === 2;
    }, 2000);
    cancel();

    expect(seen).toEqual([1, 2]);
  });

  it("cancel clears the interval so no further events arrive", async function () {
    const path = dbPath("cancel");
    const writer = createSqliteEventLog(path);
    const reader = createSqliteReader(path, POLL_MS);
    const seen: number[] = [];
    const cancel = reader.subscribe(sessionID, function (e) {
      return seen.push(e.seq);
    });
    cancel();
    await writer.append(sessionID, deviceID, event);
    await wait(POLL_MS * 5);

    expect(seen).toEqual([]);
  });
});
