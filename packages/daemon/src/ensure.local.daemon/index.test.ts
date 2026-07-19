import { describe, it, expect } from "bun:test";
import net from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Protocol from "@kuib-ai/protocol";
import ensureLocalDaemon from "./index";

describe("ensureLocalDaemon", function () {
  it("threads socketOverride through resolve+ensure and returns a UNIX endpoint with the resolved socketPath", async function () {
    const socketPath = join(tmpdir(), `kuib-test-${Date.now()}.sock`);
    const server = net.createServer();
    await new Promise<void>(function (resolve) {
      return server.listen(socketPath, resolve);
    });

    const endpoint = await ensureLocalDaemon(socketPath);

    expect(endpoint.kind).toBe(Protocol.Endpoint.EndpointKindEnum.UNIX);
    expect(
      endpoint.kind === Protocol.Endpoint.EndpointKindEnum.UNIX
        ? endpoint.socketPath
        : "",
    ).toBe(socketPath);

    await new Promise<void>(function (resolve) {
      return server.close(function () {
        return resolve();
      });
    });
  });
});
