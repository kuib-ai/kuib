import { test, expect } from "bun:test";
import { testRender } from "@opentui/solid";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import App from "./index";

const sessionID = Protocol.ID.SessionID.parse("s1");
const deviceID = Protocol.ID.DeviceID.parse("d1");
const messageID = Protocol.ID.MessageID.parse("m1");

test("renders assistant text streamed into the wired event log", async () => {
  const eventLog = Engine.EventLog.createMemoryEventLog();

  const { renderer, captureCharFrame, waitForFrame } = await testRender(
    () => <App eventLog={eventLog} sessionID={sessionID} onSubmit={() => {}} />,
    { width: 50, height: 12 },
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
  expect(captureCharFrame()).toContain("pong");

  renderer.destroy();
});
