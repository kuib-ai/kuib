import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import foldTranscript from ".";
import { TranscriptRoleEnum } from "../transcript.role.enum";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");

const envelope = function (event: AnyEvent, seq: number): EventEnvelope {
  return Protocol.Event.EventEnvelope.parse({
    _version: 1,
    epoch: 0,
    seq,
    sessionID,
    originDeviceID: deviceID,
    createdAt: seq,
    event,
  });
};

describe("foldTranscript", () => {
  it("joins user message text parts into a single user entry", () => {
    const event = Protocol.Event.UserMessageSubmitted.parse({
      type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
      messageID: "m1",
      parts: [
        {
          type: Protocol.Part.PartTypeEnum.TEXT,
          partID: "p1",
          excluded: false,
          text: "hello ",
        },
        {
          type: Protocol.Part.PartTypeEnum.TEXT,
          partID: "p2",
          excluded: false,
          text: "world",
        },
      ],
    });

    const entries = foldTranscript([envelope(event, 0)]);

    expect(entries).toEqual([
      { id: "m1", role: TranscriptRoleEnum.USER, text: "hello world" },
    ]);
  });

  it("accumulates reasoning and text deltas per messageID preserving order", () => {
    const reasoning = function (delta: string): AnyEvent {
      return Protocol.Event.ReasoningDelta.parse({
        type: Protocol.Event.EventTypeEnum.REASONING_DELTA,
        messageID: "m2",
        partID: "r1",
        delta,
      });
    };
    const text = function (delta: string): AnyEvent {
      return Protocol.Event.TextDelta.parse({
        type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
        messageID: "m2",
        partID: "t1",
        delta,
      });
    };

    const entries = foldTranscript([
      envelope(reasoning("think"), 0),
      envelope(text("Hel"), 1),
      envelope(reasoning("ing"), 2),
      envelope(text("lo"), 3),
    ]);

    expect(entries).toEqual([
      {
        id: "m2:reasoning:0",
        role: TranscriptRoleEnum.REASONING,
        text: "thinking",
      },
      { id: "m2:0", role: TranscriptRoleEnum.ASSISTANT, text: "Hello" },
    ]);
  });

  it("segments assistant text around tool results preserving chronology", () => {
    const text = function (delta: string): AnyEvent {
      return Protocol.Event.TextDelta.parse({
        type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
        messageID: "m4",
        partID: "t1",
        delta,
      });
    };
    const completed = Protocol.Event.ToolCallCompleted.parse({
      type: Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED,
      messageID: "m4",
      partID: "p1",
      callID: "c1",
      output: "file contents",
      completedAt: 1,
      kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
    });

    const entries = foldTranscript([
      envelope(text("reading it"), 0),
      envelope(completed, 1),
      envelope(text("here is the answer"), 2),
    ]);

    expect(entries).toEqual([
      { id: "m4:0", role: TranscriptRoleEnum.ASSISTANT, text: "reading it" },
      { id: "c1", role: TranscriptRoleEnum.TOOL, text: "✓ file contents" },
      {
        id: "m4:1",
        role: TranscriptRoleEnum.ASSISTANT,
        text: "here is the answer",
      },
    ]);
  });

  it("segments assistant text around an injected mid-turn user message", () => {
    const text = function (delta: string): AnyEvent {
      return Protocol.Event.TextDelta.parse({
        type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
        messageID: "m5",
        partID: "t1",
        delta,
      });
    };
    const injected = Protocol.Event.UserMessageSubmitted.parse({
      type: Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
      messageID: "u2",
      parts: [
        {
          type: Protocol.Part.PartTypeEnum.TEXT,
          partID: "p1",
          excluded: false,
          text: "also check the tests",
        },
      ],
    });

    const entries = foldTranscript([
      envelope(text("working"), 0),
      envelope(injected, 1),
      envelope(text("on it"), 2),
    ]);

    expect(entries).toEqual([
      { id: "m5:0", role: TranscriptRoleEnum.ASSISTANT, text: "working" },
      { id: "u2", role: TranscriptRoleEnum.USER, text: "also check the tests" },
      { id: "m5:1", role: TranscriptRoleEnum.ASSISTANT, text: "on it" },
    ]);
  });

  it("prefixes completed tool output with ✓ and failed with ✗, ignoring unknown events", () => {
    const completed = Protocol.Event.ToolCallCompleted.parse({
      type: Protocol.Event.EventTypeEnum.TOOL_CALL_COMPLETED,
      messageID: "m3",
      partID: "p1",
      callID: "c1",
      output: "done",
      completedAt: 1,
      kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
    });
    const failed = Protocol.Event.ToolCallFailed.parse({
      type: Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED,
      messageID: "m3",
      partID: "p2",
      callID: "c2",
      reason: Protocol.ToolCall.ToolCallErrorReasonEnum.FAILED,
      error: "boom",
      completedAt: 2,
      kind: Protocol.ToolCall.ToolCallKindEnum.NORMAL,
    });
    const ignored = Protocol.Event.StepStarted.parse({
      type: Protocol.Event.EventTypeEnum.STEP_STARTED,
      messageID: "m3",
      partID: "p3",
    });

    const entries = foldTranscript([
      envelope(completed, 0),
      envelope(ignored, 1),
      envelope(failed, 2),
    ]);

    expect(entries).toEqual([
      { id: "c1", role: TranscriptRoleEnum.TOOL, text: "✓ done" },
      { id: "c2", role: TranscriptRoleEnum.TOOL, text: "✗ boom" },
    ]);
  });
});
