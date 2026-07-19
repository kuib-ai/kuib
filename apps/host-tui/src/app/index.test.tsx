import { describe, it, expect } from "bun:test";
import { testRender } from "@opentui/solid";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import App from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");

describe("App submit gating", function () {
  it("calls onSubmit with trimmed text and clears the draft input", async function () {
    const eventLog = Engine.EventLog.createMemoryEventLog();
    const submitted: string[] = [];

    const { renderer, mockInput, waitForFrame, captureCharFrame } =
      await testRender(
        function () {
          return (
            <App
              eventLog={eventLog}
              sessionID={sessionID}
              deviceLabel="rs10@septimus"
              onSubmit={function (text) {
                return submitted.push(text);
              }}
            />
          );
        },
        { width: 60, height: 12 },
      );

    await mockInput.typeText("  hello  ");
    await waitForFrame(function (frame) {
      return frame.includes("hello");
    });
    mockInput.pressEnter();
    await waitForFrame(function (frame) {
      return !frame.includes("hello");
    });

    expect(submitted).toEqual(["hello"]);
    expect(captureCharFrame().includes("hello")).toBe(false);

    renderer.destroy();
  });

  it("ignores whitespace-only input without calling onSubmit", async function () {
    const eventLog = Engine.EventLog.createMemoryEventLog();
    const submitted: string[] = [];

    const { renderer, mockInput, waitForFrame } = await testRender(
      function () {
        return (
          <App
            eventLog={eventLog}
            sessionID={sessionID}
            deviceLabel="rs10@septimus"
            onSubmit={function (text) {
              return submitted.push(text);
            }}
          />
        );
      },
      { width: 60, height: 12 },
    );

    await mockInput.typeText("   ");
    mockInput.pressEnter();
    await waitForFrame(function (frame) {
      return frame.length > 0;
    });

    expect(submitted.length).toBe(0);

    renderer.destroy();
  });

  it("renders the right-prompt-pane layout at 80x24 (as-built frame)", async function () {
    const eventLog = Engine.EventLog.createMemoryEventLog();

    const { renderer, waitForFrame, captureCharFrame } = await testRender(
      function () {
        return (
          <App
            eventLog={eventLog}
            sessionID={sessionID}
            deviceLabel="rs10@septimus"
            onSubmit={function () {}}
          />
        );
      },
      { width: 80, height: 24 },
    );

    await eventLog.append(sessionID, deviceID, {
      type: Protocol.Event.EventTypeEnum.MESSAGE_STARTED,
      messageID,
    });
    await eventLog.append(sessionID, deviceID, {
      type: Protocol.Event.EventTypeEnum.TEXT_DELTA,
      messageID,
      partID: Protocol.ID.PartID.parse("p1"),
      delta: "The secret code is BANANA-42.",
    });

    await waitForFrame(function (frame) {
      return frame.includes("BANANA-42");
    });
    expect(captureCharFrame()).toMatchSnapshot();

    renderer.destroy();
  });

  it("subscribes on mount and folds appended envelopes into the transcript", async function () {
    const eventLog = Engine.EventLog.createMemoryEventLog();

    const { renderer, waitForFrame, captureCharFrame } = await testRender(
      function () {
        return (
          <App
            eventLog={eventLog}
            sessionID={sessionID}
            deviceLabel="rs10@septimus"
            onSubmit={function () {}}
          />
        );
      },
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

    await waitForFrame(function (frame) {
      return frame.includes("pong");
    });
    expect(captureCharFrame().includes("pong")).toBe(true);

    renderer.destroy();
  });
});
