import { describe, it, expect } from "bun:test";
import { createServer, connect } from "node:net";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import createDaemonServer from "./index";

const uniqueSocketPath = function () {
  return join(
    tmpdir(),
    `kuib-daemon-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}.sock`,
  );
};

const freePort = function () {
  return new Promise<number>((resolve) => {
    const probe = createServer();
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
};

const canConnect = function (port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = connect(port, "127.0.0.1", () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
};

describe("createDaemonServer", () => {
  it("removes a stale socket, listens on socketPath, and returns the server", async () => {
    const socketPath = uniqueSocketPath();
    const server = createDaemonServer(socketPath);

    await new Promise<void>((resolve) => server.once("listening", resolve));

    expect(server.listening).toBe(true);
    expect(server.address()).toBe(socketPath);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(socketPath, { force: true });
  });

  it("starts a second TCP server when a valid port is provided", async () => {
    const socketPath = uniqueSocketPath();
    const port = await freePort();
    const server = createDaemonServer(socketPath, port);

    await new Promise<void>((resolve) => server.once("listening", resolve));

    let connected = false;
    for (let attempt = 0; attempt < 20 && !connected; attempt++) {
      connected = await canConnect(port);
    }
    expect(connected).toBe(true);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(socketPath, { force: true });
  });

  it("skips the TCP server when the port is undefined or NaN", async () => {
    const socketPath = uniqueSocketPath();
    const port = await freePort();
    const server = createDaemonServer(socketPath, Number.NaN);

    await new Promise<void>((resolve) => server.once("listening", resolve));

    expect(server.listening).toBe(true);
    expect(await canConnect(port)).toBe(false);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(socketPath, { force: true });
  });
});
