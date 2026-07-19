import { describe, it, expect } from "bun:test";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import connectOrSpawn from "./index";
import type { SubmitMessage } from "@kuib-ai/protocol/service.message/submit.message";
import Protocol from "@kuib-ai/protocol";

const socketPath = function (): string {
  return path.join(
    os.tmpdir(),
    `kuib-engine-client-${Math.random().toString(36).slice(2)}.sock`,
  );
};

const submitMessage: SubmitMessage = {
  type: Protocol.ServiceMessage.ServiceMessageTypeEnum.SUBMIT,
  sessionID: Protocol.ID.SessionID.parse("s1"),
  prompt: "hello there",
};

describe("connectOrSpawn", function () {
  it("connects to an already-listening socket and submits framed JSON", async function () {
    const p = socketPath();
    const received: string[] = [];
    const server = net.createServer(function (conn) {
      conn.setEncoding("utf8");
      conn.on("data", function (chunk: string) {
        return received.push(chunk);
      });
    });
    await new Promise<void>(function (resolve) {
      return server.listen(p, function () {
        return resolve();
      });
    });

    const client = await connectOrSpawn({ socketPath: p, spawnArgv: [] });
    await client.submit(submitMessage);

    await new Promise<void>(function (resolve) {
      return setTimeout(resolve, 50);
    });

    expect(received.join("")).toBe(JSON.stringify(submitMessage) + "\n");

    client.close();
    await new Promise<void>(function (resolve) {
      return server.close(function () {
        return resolve();
      });
    });
  });

  it("rejects when no server exists and the spawned child never becomes reachable", async function () {
    const p = socketPath();

    await expect(
      connectOrSpawn({
        socketPath: p,
        spawnArgv: ["-e", ""],
        connectTimeoutMs: 120,
        connectIntervalMs: 20,
      }),
    ).rejects.toThrow("engine-service did not become reachable");
  });
});
