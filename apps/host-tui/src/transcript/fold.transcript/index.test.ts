import { test, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import { TranscriptRoleEnum } from "../transcript.role.enum";
import foldTranscript from "./index";

const messageID = Protocol.ID.MessageID.parse("m1");

const envelope = function (seq: number, event: AnyEvent): EventEnvelope {
  return Protocol.Event.EventEnvelope.parse({
    _version: 1,
    epoch: 0,
    seq,
    sessionID: Protocol.ID.SessionID.parse("s1"),
    originDeviceID: Protocol.ID.DeviceID.parse("d1"),
    createdAt: 0,
    event,
  });
};

test("accumulates text deltas into one assistant entry", () => {
  const entries = foldTranscript([
    envelope(0, {
      type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      messageID,
    }),
    envelope(1, {
      type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("p1"),
      delta: "Hel",
    }),
    envelope(2, {
      type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("p1"),
      delta: "lo",
    }),
  ]);
  expect(entries).toEqual([
    { id: "m1", role: TranscriptRoleEnum.ASSISTANT, text: "Hello" },
  ]);
});

test("renders reasoning as its own entry before the assistant answer", () => {
  const entries = foldTranscript([
    envelope(0, {
      type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      messageID,
    }),
    envelope(1, {
      type: Protocol.Event.EventTypeEnum.REASONING_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("r1"),
      delta: "think",
    }),
    envelope(2, {
      type: Protocol.Event.EventTypeEnum.REASONING_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("r1"),
      delta: "ing",
    }),
    envelope(3, {
      type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("t1"),
      delta: "pong",
    }),
  ]);
  expect(entries).toEqual([
    {
      id: "m1:reasoning",
      role: TranscriptRoleEnum.REASONING,
      text: "thinking",
    },
    { id: "m1", role: TranscriptRoleEnum.ASSISTANT, text: "pong" },
  ]);
});

test("renders a submitted user message from its text parts", () => {
  const entries = foldTranscript([
    envelope(0, {
      type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
      messageID,
      parts: [
        {
          type: Protocol.Part.PartTypeEnum.TEXT,
          partID: Protocol.ID.PartID.parse("p1"),
          excluded: false,
          text: "hi there",
        },
      ],
    }),
  ]);
  expect(entries).toEqual([
    { id: "m1", role: TranscriptRoleEnum.USER, text: "hi there" },
  ]);
});
