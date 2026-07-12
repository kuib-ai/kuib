import { describe, it, expect } from "bun:test";
import createConsoleLogger from "../create.console.logger";
import withError from "../with.error";
import LogScope from "./index";

describe("log.scope", () => {
  it("merges nested scopes; inner wins on key clash", () => {
    expect(LogScope.currentScope()).toEqual({});

    LogScope.withScope({ runId: "r1", phase: "outer" }, () => {
      expect(LogScope.currentScope()).toEqual({ runId: "r1", phase: "outer" });

      LogScope.withScope({ phase: "tool", toolName: "readFile" }, () => {
        expect(LogScope.currentScope()).toEqual({
          runId: "r1",
          phase: "tool",
          toolName: "readFile",
        });
      });

      expect(LogScope.currentScope()).toEqual({ runId: "r1", phase: "outer" });
    });

    expect(LogScope.currentScope()).toEqual({});
  });

  it("survives await under the root scope", async () => {
    await LogScope.withScope({ runId: "async-1" }, async () => {
      await Bun.sleep(5);
      expect(LogScope.currentScope()).toEqual({ runId: "async-1" });
    });
    expect(LogScope.currentScope()).toEqual({});
  });

  it("isolates concurrent roots", async () => {
    const seen: string[] = [];

    const a = LogScope.withScope({ runId: "A" }, async () => {
      await Bun.sleep(10);
      seen.push(`a:${LogScope.currentScope().runId}`);
    });

    const b = LogScope.withScope({ runId: "B" }, async () => {
      await Bun.sleep(1);
      seen.push(`b:${LogScope.currentScope().runId}`);
    });

    await Promise.all([a, b]);
    expect(seen).toEqual(["b:B", "a:A"]);
  });

  it("logger emit picks up ambient scope (example)", () => {
    const calls: unknown[][] = [];
    const log = createConsoleLogger({
      name: "demo",
      sink: {
        debug: () => {},
        info: (...args) => {
          calls.push(args);
        },
        warn: () => {},
        error: () => {},
      },
    });

    LogScope.withScope({ runId: "run_42", sessionID: "sess_1" }, () => {
      log.info("turn started");

      LogScope.withScope({ toolName: "readFile", callID: "c1" }, () => {
        log.info({ path: "/tmp/x" }, "tool done");
      });

      const bound = LogScope.bindLogger(log);
      bound.info("streaming");
    });

    expect(calls).toEqual([
      ["turn started", { name: "demo", runId: "run_42", sessionID: "sess_1" }],
      [
        "tool done",
        {
          name: "demo",
          runId: "run_42",
          sessionID: "sess_1",
          toolName: "readFile",
          callID: "c1",
          path: "/tmp/x",
        },
      ],
      [
        "streaming",
        {
          name: "demo",
          runId: "run_42",
          sessionID: "sess_1",
        },
      ],
    ]);
  });

  it("pops nested scope when the inner async work rejects", async () => {
    await LogScope.withScope({ runId: "r" }, async () => {
      const [error] = await withError(
        LogScope.withScope({ toolName: "boom" }, async () => {
          await Bun.sleep(1);
          throw new Error("tool failed");
        }),
      );

      expect(error).not.toBeNull();
      expect(LogScope.currentScope()).toEqual({ runId: "r" });
    });
  });
});
