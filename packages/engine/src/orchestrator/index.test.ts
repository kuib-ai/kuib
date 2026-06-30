import { describe, it, expect } from "vitest";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");

const streamingModel = new MockLanguageModelV3({
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: "reasoning-start", id: "r1" },
        { type: "reasoning-delta", id: "r1", delta: "think" },
        { type: "reasoning-delta", id: "r1", delta: "ing" },
        { type: "reasoning-end", id: "r1" },
        { type: "text-start", id: "t1" },
        { type: "text-delta", id: "t1", delta: "Hello" },
        { type: "text-delta", id: "t1", delta: " world" },
        { type: "text-end", id: "t1" },
        {
          type: "finish",
          finishReason: { unified: "stop", raw: "stop" },
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 2, text: 2, reasoning: 0 },
          },
        },
      ],
    }),
  }),
});

describe("orchestrator runAgent", () => {
  it("emits the user message then streams assistant deltas into the event log", async () => {
    const eventLog = Engine.EventLog.createMemoryEventLog();
    const daemonClient =
      Engine.DaemonClient.createDaemonClient("http://localhost:1");

    await Engine.runAgent({
      prompt: "hi there",
      sessionID,
      deviceID,
      model: streamingModel,
      daemonClient,
      eventLog,
    });

    const events: AnyEvent[] = [];
    eventLog.replay(sessionID, -1, (envelope) => events.push(envelope.event));

    const first = events[0];
    expect(first?.type).toBe(
      Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED,
    );
    if (first?.type === Protocol.Event.EventTypeEnum.USER_MESSAGE_SUBMITTED) {
      const text = first.parts
        .map((part) => ("text" in part ? part.text : ""))
        .join("");
      expect(text).toBe("hi there");
    }

    expect(
      events.some(
        (e) => e.type === Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      ),
    ).toBe(true);

    const streamed = events
      .filter((e) => e.type === Protocol.Event.EventTypeEnum.TEXT_DELTA)
      .map((e) =>
        e.type === Protocol.Event.EventTypeEnum.TEXT_DELTA ? e.delta : "",
      )
      .join("");
    expect(streamed).toBe("Hello world");

    const reasoned = events
      .filter((e) => e.type === Protocol.Event.EventTypeEnum.REASONING_DELTA)
      .map((e) =>
        e.type === Protocol.Event.EventTypeEnum.REASONING_DELTA ? e.delta : "",
      )
      .join("");
    expect(reasoned).toBe("thinking");
  });
});
