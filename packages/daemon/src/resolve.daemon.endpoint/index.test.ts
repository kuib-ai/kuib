import { describe, it, expect } from "bun:test";
import net from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Protocol from "@kuib-ai/protocol";
import resolveDaemonEndpoint from "./index";

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
    const socketPath = join(
      tmpdir(),
      `kuib-rde-${process.pid}-${Date.now()}.sock`,
    );
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
