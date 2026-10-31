import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import net from "node:net";
import { mkdirSync } from "node:fs";
import createSocketPath from "@kuib-ai/testing/create.socket.path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import changeCwd from "@kuib-ai/testing/change.cwd";
import ensureDaemon from "./index.ts";

describe("ensureDaemon", function () {
  it("returns without spawning when the socket is already alive", async function () {
    using socket = createSocketPath();
    const socketPath = socket.path;
    const server = net.createServer();
    await new Promise<void>(function (resolve) {
      return server.listen(socketPath, resolve);
    });

    const started = Date.now();
    const result = await ensureDaemon(socketPath);
    const elapsed = Date.now() - started;
    server.close();

    expect(result).toBeUndefined();
    expect(elapsed).toBeLessThan(1000);
  });

  it("spawns a child on a dead socket then resolves once the probe succeeds", async function () {
    using dir = createTempDir();
    using _cwd = changeCwd(dir.path);
    using socket = createSocketPath();
    const pid = await ensureDaemon(socket.path);
    expect(pid).toBeGreaterThan(0);
    if (pid === undefined) {
      throw new Error("ensureDaemon did not return a child pid");
    }
    const exited = new Promise<void>(function (resolve) {
      const poll = function (): void {
        // eslint-disable-next-line no-restricted-syntax
        try {
          process.kill(pid, 0);
          setTimeout(poll, 20);
        } catch {
          resolve();
        }
      };
      poll();
    });
    process.kill(pid, "SIGTERM");
    await exited;
  });

  it("rejects after the timeout when the socket never becomes reachable", async function () {
    using dir = createTempDir();
    using _cwd = changeCwd(dir.path);
    using socket = createSocketPath();
    const unreachableSocket = socket.path;
    mkdirSync(unreachableSocket);

    const started = Date.now();
    await expect(ensureDaemon(unreachableSocket)).rejects.toThrow(
      /did not become reachable/,
    );
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(4000);
  });
});
