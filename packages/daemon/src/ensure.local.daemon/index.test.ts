import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import net from "node:net";
import createSocketPath from "@kuib-ai/testing/create.socket.path";
import Protocol from "@kuib-ai/protocol";
import ensureLocalDaemon from "./index.ts";

describe("ensureLocalDaemon", function () {
  it("threads socketOverride through resolve+ensure and returns a UNIX endpoint with the resolved socketPath", async function () {
    using socket = createSocketPath();
    const socketPath = socket.path;
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
