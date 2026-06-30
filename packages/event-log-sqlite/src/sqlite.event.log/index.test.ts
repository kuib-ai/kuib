import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Protocol from "@kuib-ai/protocol";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import createSqliteEventLog from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");
const event: AnyEvent = {
  type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
  messageID,
};

test("assigns monotonic seq from 0 with epoch 0 and stamps the envelope", async () => {
  const log = createSqliteEventLog(":memory:");
  const a = await log.append(sessionID, deviceID, event);
  const b = await log.append(sessionID, deviceID, event);
  expect(a.seq).toBe(0);
  expect(b.seq).toBe(1);
  expect(a.epoch).toBe(0);
  expect(a._version).toBe(1);
  expect(a.originDeviceID).toBe(deviceID);
});

test("delivers appended events to subscribers", async () => {
  const log = createSqliteEventLog(":memory:");
  const seen: number[] = [];
  log.subscribe(sessionID, (envelope) => seen.push(envelope.seq));
  await log.append(sessionID, deviceID, event);
  await log.append(sessionID, deviceID, event);
  expect(seen).toEqual([0, 1]);
});

test("replays only events after the seq cursor", async () => {
  const log = createSqliteEventLog(":memory:");
  await log.append(sessionID, deviceID, event);
  await log.append(sessionID, deviceID, event);
  const seen: number[] = [];
  log.replay(sessionID, 0, (envelope) => seen.push(envelope.seq));
  expect(seen).toEqual([1]);
});

test("persists across reopen of the same file", async () => {
  const path = join(tmpdir(), `kuib-test-${Date.now()}.db`);
  const first = createSqliteEventLog(path);
  await first.append(sessionID, deviceID, event);
  await first.append(sessionID, deviceID, event);

  const reopened = createSqliteEventLog(path);
  const seen: number[] = [];
  reopened.replay(sessionID, -1, (envelope) => seen.push(envelope.seq));
  expect(seen).toEqual([0, 1]);

  const next = await reopened.append(sessionID, deviceID, event);
  expect(next.seq).toBe(2);
});
