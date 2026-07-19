import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import buildMessages from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");

const userEvent = function (messageID: string, text: string): AnyEvent {
  return {
    type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
    messageID: Protocol.ID.MessageID.parse(messageID),
    parts: [
      {
        type: Protocol.Part.PartTypeEnum.TEXT,
        partID: Protocol.ID.PartID.parse(`${messageID}-p1`),
        excluded: false,
        text,
      },
    ],
  };
};

const textDelta = function (messageID: string, delta: string): AnyEvent {
  return {
    type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
    messageID: Protocol.ID.MessageID.parse(messageID),
    partID: Protocol.ID.PartID.parse(`${messageID}-t1`),
    delta,
  };
};

describe("buildMessages fold", function () {
  it("folds a user message then accumulated text deltas into user/assistant messages", async function () {
    const log = Engine.EventLog.createMemoryEventLog();
    await log.append(sessionID, deviceID, userEvent("m1", "hi there"));
    await log.append(sessionID, deviceID, textDelta("a1", "Hello"));
    await log.append(sessionID, deviceID, textDelta("a1", " world"));

    const messages = buildMessages(log, sessionID);

    expect(messages).toEqual([
      { role: "user", content: "hi there" },
      { role: "assistant", content: "Hello world" },
    ]);
  });

  it("does not flush an assistant accumulator that has no text", async function () {
    const log = Engine.EventLog.createMemoryEventLog();
    await log.append(sessionID, deviceID, userEvent("m1", "q"));
    await log.append(sessionID, deviceID, textDelta("a1", ""));
    await log.append(sessionID, deviceID, {
      type: Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED,
      messageID: Protocol.ID.MessageID.parse("a1"),
      completedAt: 0,
    });

    const messages = buildMessages(log, sessionID);

    expect(messages).toEqual([{ role: "user", content: "q" }]);
  });

  it("flushes the current assistant when the messageID switches mid-stream", async function () {
    const log = Engine.EventLog.createMemoryEventLog();
    await log.append(sessionID, deviceID, textDelta("a1", "first"));
    await log.append(sessionID, deviceID, textDelta("a2", "second"));

    const messages = buildMessages(log, sessionID);

    expect(messages).toEqual([
      { role: "assistant", content: "first" },
      { role: "assistant", content: "second" },
    ]);
  });
});
