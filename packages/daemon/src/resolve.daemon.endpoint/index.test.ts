import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import net from "node:net";
import createSocketPath from "@kuib-ai/testing/create.socket.path";
import Protocol from "@kuib-ai/protocol";
import resolveDaemonEndpoint from "./index.ts";

describe("resolveDaemonEndpoint", function () {
  it("returns a TCP endpoint carrying the remoteUrl when one is provided", async function () {
    const endpoint = await resolveDaemonEndpoint(
      "http://host:9000",
      "/ignored.sock",
    );
    expect(endpoint.kind).toBe(Protocol.Endpoint.EndpointKindEnum.TCP);
    expect(
      endpoint.kind === Protocol.Endpoint.EndpointKindEnum.TCP
        ? endpoint.url
        : "",
    ).toBe("http://host:9000");
  });

  it("falls back to the local unix daemon at the socketOverride when remoteUrl is undefined", async function () {
    using socket = createSocketPath();
    const socketPath = socket.path;
    const server = net.createServer();
    await new Promise<void>(function (resolve) {
      return server.listen(socketPath, resolve);
    });

    const endpoint = await resolveDaemonEndpoint(undefined, socketPath);

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
