import { describe, it, expect } from "bun:test";
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

const newLog = function () {
  return createSqliteEventLog(":memory:");
};

describe("sqlite event log", function () {
  it("assigns monotonic seq from 0 and notifies subscribers", async function () {
    const log = newLog();
    const seen: number[] = [];
    log.subscribe(sessionID, function (envelope) {
      return seen.push(envelope.seq);
    });
    const a = await log.append(sessionID, deviceID, event);
    const b = await log.append(sessionID, deviceID, event);
    expect(a.seq).toBe(0);
    expect(b.seq).toBe(1);
    expect(seen).toEqual([0, 1]);
  });

  it("replays only events after the seq cursor in order", async function () {
    const log = newLog();
    await log.append(sessionID, deviceID, event);
    await log.append(sessionID, deviceID, event);
    await log.append(sessionID, deviceID, event);
    const seen: number[] = [];
    log.replay(sessionID, 0, function (envelope) {
      return seen.push(envelope.seq);
    });
    expect(seen).toEqual([1, 2]);
  });

  it("subscribe with afterSeq replays then delivers live appends", async function () {
    const log = newLog();
    await log.append(sessionID, deviceID, event);
    await log.append(sessionID, deviceID, event);
    const seen: number[] = [];
    log.subscribe(
      sessionID,
      function (envelope) {
        return seen.push(envelope.seq);
      },
      0,
    );
    await log.append(sessionID, deviceID, event);
    expect(seen).toEqual([1, 2]);
  });

  it("stops delivering after unsubscribe", async function () {
    const log = newLog();
    const seen: number[] = [];
    const unsubscribe = log.subscribe(sessionID, function (envelope) {
      return seen.push(envelope.seq);
    });
    await log.append(sessionID, deviceID, event);
    unsubscribe();
    await log.append(sessionID, deviceID, event);
    expect(seen).toEqual([0]);
  });
});
