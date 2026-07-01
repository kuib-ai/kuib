import { describe, it, expect } from "bun:test";
import net from "node:net";
import os from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import ensureDaemon from "./index";

const makeDir = function (): string {
  return mkdtempSync(join(os.tmpdir(), "kuib-ensure-"));
};

describe("ensureDaemon", () => {
  it("returns without spawning when the socket is already alive", async () => {
    const dir = makeDir();
    const socketPath = join(dir, "alive.sock");
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(socketPath, resolve));

    const started = Date.now();
    const result = await ensureDaemon(socketPath);
    const elapsed = Date.now() - started;
    server.close();

    expect(result).toBeUndefined();
    expect(elapsed).toBeLessThan(1000);
  });

  it("spawns a child on a dead socket then resolves once the probe succeeds", async () => {
    const dir = makeDir();
    const socketPath = join(dir, "spawn.sock");
    const server = net.createServer();

    const ensured = ensureDaemon(socketPath);

    await new Promise<void>((resolve) => setTimeout(resolve, 40));
    await new Promise<void>((resolve) => server.listen(socketPath, resolve));

    await ensured;
    expect(server.listening).toBe(true);
    server.close();
  }, 15000);

  it("rejects after the timeout when the socket never becomes reachable", async () => {
    const dir = makeDir();
    const socketPathInMissingParentDir = join(dir, "missing", "never.sock");

    const started = Date.now();
    await expect(ensureDaemon(socketPathInMissingParentDir)).rejects.toThrow(
      /did not become reachable/,
    );
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(4000);
  }, 15000);
});
