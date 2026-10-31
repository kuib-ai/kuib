import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync } from "node:fs";
import net from "node:net";
import { delimiter } from "node:path";
import overrideEnv from "../override.env/index.ts";
import createSocketPath from "./index.ts";
import type { SocketPath } from "./index.ts";

const pool = function (): string[] {
  return (process.env["KUIB_TEST_SOCKETS"] ?? "").split(delimiter);
};

const listen = function (path: string): Promise<net.Server> {
  return new Promise<net.Server>(function (resolve, reject) {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(path, function () {
      return resolve(server);
    });
  });
};

const connect = function (path: string): Promise<boolean> {
  return new Promise<boolean>(function (resolve) {
    const socket = net.connect(path, function () {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", function () {
      return resolve(false);
    });
  });
};

const close = function (server: net.Server): Promise<void> {
  return new Promise<void>(function (resolve) {
    server.close(function () {
      return resolve();
    });
  });
};

describe("createSocketPath", function () {
  it("hands out a path the sandbox granted, on which a test can listen and connect", async function () {
    using socket = createSocketPath();

    expect(pool()).toContain(socket.path);
    const server = await listen(socket.path);
    expect(await connect(socket.path)).toBe(true);
    await close(server);
  });

  it("hands out distinct paths while they are held and reuses a freed one", function () {
    let first = "";
    const scope = function (): void {
      using one = createSocketPath();
      using two = createSocketPath();
      first = one.path;
      expect(two.path).not.toBe(one.path);
    };

    scope();
    using again = createSocketPath();

    expect(again.path).toBe(first);
  });

  it("removes the socket file when the scope ends", async function () {
    let path = "";
    const scope = async function (): Promise<void> {
      using socket = createSocketPath();
      path = socket.path;
      const server = await listen(path);
      expect(existsSync(path)).toBe(true);
      await close(server);
    };

    await scope();

    expect(existsSync(path)).toBe(false);
    expect(existsSync(`${path}.claim`)).toBe(false);
  });

  it("throws when every path is held", function () {
    const held: SocketPath[] = [];
    for (const _path of pool()) {
      held.push(createSocketPath());
    }

    expect(createSocketPath).toThrow("in use");

    for (const socket of held) {
      socket[Symbol.dispose]();
    }
  });

  it("throws outside the runner, where no path was granted", function () {
    using _env = overrideEnv({ KUIB_TEST_SOCKETS: undefined });

    expect(createSocketPath).toThrow("KUIB_TEST_SOCKETS is not set");
  });
});
