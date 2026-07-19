import { describe, it, expect } from "bun:test";
import createConsoleLogger from "./index";

describe("createConsoleLogger", function () {
  it("forwards info with bindings to the sink", function () {
    const calls: unknown[][] = [];
    const log = createConsoleLogger({
      name: "test",
      sink: {
        debug: function () {},
        info: function (...args) {
          calls.push(args);
        },
        warn: function () {},
        error: function () {},
      },
    });

    log.info("booted");
    log.child({ session: "s1" }).info({ turn: 1 }, "step");

    expect(calls[0]).toEqual(["booted", { name: "test" }]);
    expect(calls[1]).toEqual([
      "step",
      { name: "test", session: "s1", turn: 1 },
    ]);
  });
});
