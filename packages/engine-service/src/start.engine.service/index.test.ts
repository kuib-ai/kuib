// @context @journal/host-layer
import { describe, it, expect } from "bun:test";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import Engine from "@kuib-ai/engine";
import startEngineService from "./index";
import type { RunTurn } from "./index";

let counter = 0;
const uniqueSocketPath = function (): string {
  counter++;
  return join(tmpdir(), `kuib-es-focused-${process.pid}-${counter}.sock`);
};

const delay = function (ms: number): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, ms));
};

const waitUntil = function (
  pred: () => boolean,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const step = function (): Promise<boolean> {
    if (pred()) {
      return Promise.resolve(true);
    }
    if (Date.now() >= deadline) {
      return Promise.resolve(pred());
    }
    return delay(10).then(step);
  };
  return step();
};

const connectClient = function (socketPath: string): Promise<net.Socket> {
  return new Promise<net.Socket>((resolve, reject) => {
    const socket = net.connect(socketPath);
    socket.once("connect", () => resolve(socket));
    socket.once("error", (err) => reject(err));
  });
};

const noopRunTurn: RunTurn = function (): Promise<void> {
  return Promise.resolve();
};

describe("startEngineService", () => {
  it("invokes runTurn with sessionID/prompt on a valid SUBMIT and reaps after idle", async () => {
    const socketPath = uniqueSocketPath();
    const calls: Array<{ sessionID: string; prompt: string }> = [];
    const handle = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: function (input): Promise<void> {
        calls.push({ sessionID: input.sessionID, prompt: input.prompt });
        return Promise.resolve();
      },
      reapIdleMs: 40,
    });

    const client = await connectClient(socketPath);
    client.write(
      `${JSON.stringify({ type: "submit", sessionID: "s1", prompt: "hello" })}\n`,
    );

    const gotCall = await waitUntil(() => calls.length === 1, 1000);
    expect(gotCall).toBe(true);
    expect(calls[0]?.sessionID).toBe("s1");
    expect(calls[0]?.prompt).toBe("hello");

    client.end();
    const reaped = await waitUntil(() => !existsSync(socketPath), 2000);
    expect(reaped).toBe(true);

    await handle.close();
    rmSync(socketPath, { force: true });
  });

  it("ignores malformed JSON and schema-invalid frames without invoking runTurn", async () => {
    const socketPath = uniqueSocketPath();
    let called = 0;
    const handle = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: function (): Promise<void> {
        called++;
        return Promise.resolve();
      },
      reapIdleMs: 5000,
    });

    const client = await connectClient(socketPath);
    client.write("this is not json\n");
    client.write(`${JSON.stringify({ type: "submit" })}\n`);
    client.write(`${JSON.stringify({ type: "unknown", x: 1 })}\n`);

    await delay(150);
    expect(called).toBe(0);

    client.end();
    await handle.close();
    rmSync(socketPath, { force: true });
  });

  it("queues submits arriving mid-turn and runs them in order without overlap", async () => {
    const socketPath = uniqueSocketPath();
    const trace: string[] = [];
    const handle = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: async function (input): Promise<void> {
        trace.push(`start:${input.prompt}`);
        await delay(60);
        trace.push(`end:${input.prompt}`);
      },
      reapIdleMs: 5000,
    });

    const client = await connectClient(socketPath);
    const frame = function (prompt: string): string {
      return `${JSON.stringify({ type: "submit", sessionID: "s1", prompt })}\n`;
    };
    client.write(frame("a") + frame("b") + frame("c"));

    const done = await waitUntil(() => trace.length === 6, 3000);
    expect(done).toBe(true);
    expect(trace).toEqual([
      "start:a",
      "end:a",
      "start:b",
      "end:b",
      "start:c",
      "end:c",
    ]);

    client.end();
    await handle.close();
    rmSync(socketPath, { force: true });
  });

  it("hands queued prompts to the running turn via takePending", async () => {
    const socketPath = uniqueSocketPath();
    const drained: string[][] = [];
    let turns = 0;
    const handle = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: async function (input): Promise<void> {
        turns++;
        await delay(60);
        drained.push(input.takePending());
      },
      reapIdleMs: 5000,
    });

    const client = await connectClient(socketPath);
    const frame = function (prompt: string): string {
      return `${JSON.stringify({ type: "submit", sessionID: "s1", prompt })}\n`;
    };
    client.write(frame("first"));
    await delay(20);
    client.write(frame("second") + frame("third"));

    const done = await waitUntil(() => drained.length === 1, 3000);
    expect(done).toBe(true);
    expect(drained[0]).toEqual(["second", "third"]);
    await delay(100);
    expect(turns).toBe(1);

    client.end();
    await handle.close();
    rmSync(socketPath, { force: true });
  });

  it("rejects with EADDRINUSE while a live server owns the socket", async () => {
    const socketPath = uniqueSocketPath();
    const first = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: noopRunTurn,
      reapIdleMs: 5000,
    });

    await expect(
      startEngineService({
        socketPath,
        eventLog: Engine.EventLog.createMemoryEventLog(),
        runTurn: noopRunTurn,
        reapIdleMs: 5000,
      }),
    ).rejects.toThrow(/already running/);

    await first.close();
    rmSync(socketPath, { force: true });
  });

  it("unlinks a stale socket file and rebinds when nothing is listening", async () => {
    const socketPath = uniqueSocketPath();
    writeFileSync(socketPath, "");
    expect(existsSync(socketPath)).toBe(true);

    const handle = await startEngineService({
      socketPath,
      eventLog: Engine.EventLog.createMemoryEventLog(),
      runTurn: noopRunTurn,
      reapIdleMs: 5000,
    });

    const client = await connectClient(socketPath);
    expect(client.destroyed).toBe(false);

    client.end();
    await handle.close();
    rmSync(socketPath, { force: true });
  });
});
