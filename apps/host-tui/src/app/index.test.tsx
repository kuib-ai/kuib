import { describe, it, expect } from "bun:test";
import { testRender } from "@opentui/solid";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import App from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");

describe("App submit gating", () => {
  it("calls onSubmit with trimmed text and clears the draft input", async () => {
    const eventLog = Engine.EventLog.createMemoryEventLog();
    const submitted: string[] = [];

    const { renderer, mockInput, waitForFrame, captureCharFrame } =
      await testRender(
        () => (
          <App
            eventLog={eventLog}
            sessionID={sessionID}
            deviceLabel="rs10@septimus"
            onSubmit={(text) => submitted.push(text)}
          />
        ),
        { width: 60, height: 12 },
      );

    await mockInput.typeText("  hello  ");
    await waitForFrame((frame) => frame.includes("hello"));
    mockInput.pressEnter();
    await waitForFrame((frame) => !frame.includes("hello"));

    expect(submitted).toEqual(["hello"]);
    expect(captureCharFrame().includes("hello")).toBe(false);

    renderer.destroy();
  });

  it("ignores whitespace-only input without calling onSubmit", async () => {
    const eventLog = Engine.EventLog.createMemoryEventLog();
    const submitted: string[] = [];

    const { renderer, mockInput, waitForFrame } = await testRender(
      () => (
        <App
          eventLog={eventLog}
          sessionID={sessionID}
          deviceLabel="rs10@septimus"
          onSubmit={(text) => submitted.push(text)}
        />
      ),
      { width: 60, height: 12 },
    );

    await mockInput.typeText("   ");
    mockInput.pressEnter();
    await waitForFrame((frame) => frame.length > 0);

    expect(submitted.length).toBe(0);

    renderer.destroy();
  });

  it("subscribes on mount and folds appended envelopes into the transcript", async () => {
    const eventLog = Engine.EventLog.createMemoryEventLog();

    const { renderer, waitForFrame, captureCharFrame } = await testRender(
      () => (
        <App
          eventLog={eventLog}
          sessionID={sessionID}
          deviceLabel="rs10@septimus"
          onSubmit={() => {}}
        />
      ),
      { width: 60, height: 12 },
    );

    await eventLog.append(sessionID, deviceID, {
      type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      messageID,
    });
    await eventLog.append(sessionID, deviceID, {
      type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("p1"),
      delta: "pong",
    });

    await waitForFrame((frame) => frame.includes("pong"));
    expect(captureCharFrame().includes("pong")).toBe(true);

    renderer.destroy();
  });
});
