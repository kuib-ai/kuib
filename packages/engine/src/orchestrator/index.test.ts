import { describe, it, expect } from "bun:test";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");

const daemonClient = Engine.DaemonClient.createDaemonClient(
  Protocol.Endpoint.AnyEndpoint.parse({
    kind: "tcp",
    url: "http://localhost:1",
  }),
);

const collect = function (
  eventLog: ReturnType<typeof Engine.EventLog.createMemoryEventLog>,
): AnyEvent[] {
  const events: AnyEvent[] = [];
  eventLog.replay(sessionID, -1, (envelope) => events.push(envelope.event));
  return events;
};

describe("orchestrator runAgent", () => {
  it("emits user-submitted -> started -> text-delta -> completed in order", async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t1" },
            { type: "text-delta", id: "t1", delta: "Hello" },
            { type: "text-delta", id: "t1", delta: " world" },
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
                outputTokens: { total: 2, text: 2, reasoning: 0 },
              },
            },
          ],
        }),
      }),
    });

    const eventLog = Engine.EventLog.createMemoryEventLog();
    await Engine.runAgent({
      prompt: "hi there",
      sessionID,
      deviceID,
      model,
      daemonClient,
      eventLog,
    });

    const events = collect(eventLog);
    const types = events.map((e) => e.type);

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

    const startedAt = types.indexOf(
      Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
    );
    const completedAt = types.indexOf(
      Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED,
    );
    expect(startedAt).toBeGreaterThan(0);
    expect(completedAt).toBeGreaterThan(startedAt);
    expect(types).not.toContain(Protocol.Event.EventTypeEnum.MESSAGE_FAILED);

    const streamed = events
      .filter((e) => e.type === Protocol.Event.EventTypeEnum.TEXT_DELTA)
      .map((e) =>
        e.type === Protocol.Event.EventTypeEnum.TEXT_DELTA ? e.delta : "",
      )
      .join("");
    expect(streamed).toBe("Hello world");
  });

  it("maps a tool-call chunk to TOOL_CALL_STARTED carrying the call id", async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            {
              type: "tool-call",
              toolCallId: "call-1",
              toolName: "readFile",
              input: JSON.stringify({ path: "/etc/hostname" }),
            },
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
                outputTokens: { total: 0, text: 0, reasoning: 0 },
              },
            },
          ],
        }),
      }),
    });

    const eventLog = Engine.EventLog.createMemoryEventLog();
    await Engine.runAgent({
      prompt: "read it",
      sessionID,
      deviceID,
      model,
      daemonClient,
      eventLog,
    });

    const started = collect(eventLog).find(
      (e) => e.type === Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED,
    );
    expect(
      started?.type === Protocol.Event.EventTypeEnum.TOOL_CALL_STARTED
        ? started.callID
        : undefined,
    ).toBe(Protocol.ID.ToolCallID.parse("call-1"));
  });

  it("emits TOOL_CALL_FAILED when a tool execution fails", async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            {
              type: "tool-call",
              toolCallId: "call-err",
              toolName: "readFile",
              input: JSON.stringify({ path: "/etc/hostname" }),
            },
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
                outputTokens: { total: 0, text: 0, reasoning: 0 },
              },
            },
          ],
        }),
      }),
    });

    const eventLog = Engine.EventLog.createMemoryEventLog();
    await Engine.runAgent({
      prompt: "read it",
      sessionID,
      deviceID,
      model,
      daemonClient,
      eventLog,
    });

    const failed = collect(eventLog).find(
      (e) => e.type === Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED,
    );
    expect(
      failed?.type === Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED
        ? failed.callID
        : undefined,
    ).toBe(Protocol.ID.ToolCallID.parse("call-err"));
    expect(
      failed?.type === Protocol.Event.EventTypeEnum.TOOL_CALL_FAILED
        ? failed.reason
        : undefined,
    ).toBe(Protocol.ToolCall.ToolCallErrorReasonEnum.FAILED);
  });

  it("on stream error emits a ⚠️ text-delta and MESSAGE_FAILED, then returns without MESSAGE_COMPLETED", async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t1" },
            { type: "text-delta", id: "t1", delta: "partial" },
            { type: "error", error: new Error("boom") },
          ],
        }),
      }),
    });

    const eventLog = Engine.EventLog.createMemoryEventLog();
    await Engine.runAgent({
      prompt: "go",
      sessionID,
      deviceID,
      model,
      daemonClient,
      eventLog,
    });

    const events = collect(eventLog);

    const failed = events.find(
      (e) => e.type === Protocol.Event.EventTypeEnum.MESSAGE_FAILED,
    );
    expect(
      failed?.type === Protocol.Event.EventTypeEnum.MESSAGE_FAILED
        ? failed.error
        : undefined,
    ).toBe("boom");

    const errorDelta = events.find(
      (e) =>
        e.type === Protocol.Event.EventTypeEnum.TEXT_DELTA &&
        e.delta.startsWith("⚠️"),
    );
    expect(
      errorDelta?.type === Protocol.Event.EventTypeEnum.TEXT_DELTA
        ? errorDelta.delta
        : undefined,
    ).toBe("⚠️ boom");

    expect(events.map((e) => e.type)).not.toContain(
      Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED,
    );
  });
});
