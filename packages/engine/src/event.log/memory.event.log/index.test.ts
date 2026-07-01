import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");
const event: AnyEvent = {
  type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
  messageID,
};

describe("memory event log", () => {
  it("assigns monotonic seq from 0 with epoch 0 and stamps the envelope", async () => {
    const log = Engine.EventLog.createMemoryEventLog();
    const a = await log.append(sessionID, deviceID, event);
    const b = await log.append(sessionID, deviceID, event);
    expect(a.seq).toBe(0);
    expect(b.seq).toBe(1);
    expect(a.epoch).toBe(0);
    expect(a._version).toBe(1);
    expect(a.originDeviceID).toBe(deviceID);
  });

  it("delivers appended events to subscribers", async () => {
    const log = Engine.EventLog.createMemoryEventLog();
    const seen: number[] = [];
    log.subscribe(sessionID, (envelope) => seen.push(envelope.seq));
    await log.append(sessionID, deviceID, event);
    await log.append(sessionID, deviceID, event);
    expect(seen).toEqual([0, 1]);
  });

  it("replays only events after the seq cursor", async () => {
    const log = Engine.EventLog.createMemoryEventLog();
    await log.append(sessionID, deviceID, event);
    await log.append(sessionID, deviceID, event);
    const seen: number[] = [];
    log.replay(sessionID, 0, (envelope) => seen.push(envelope.seq));
    expect(seen).toEqual([1]);
  });
});
