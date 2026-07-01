import { describe, it, expect } from "bun:test";
import net from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Protocol from "@kuib-ai/protocol";
import ensureLocalDaemon from "./index";

describe("ensureLocalDaemon", () => {
  it("threads socketOverride through resolve+ensure and returns a UNIX endpoint with the resolved socketPath", async () => {
    const socketPath = join(tmpdir(), `kuib-test-${Date.now()}.sock`);
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(socketPath, resolve));

    const endpoint = await ensureLocalDaemon(socketPath);

    expect(endpoint.kind).toBe(Protocol.Endpoint.EndpointKindEnum.UNIX);
    expect(
      endpoint.kind === Protocol.Endpoint.EndpointKindEnum.UNIX
        ? endpoint.socketPath
        : "",
    ).toBe(socketPath);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
