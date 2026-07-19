import { describe, it } from "bun:test";
import createNoopLogger from "./index";

describe("createNoopLogger", function () {
  it("accepts log calls without throwing", function () {
    const log = createNoopLogger();
    log.info("hello");
    log.error({ code: "x" }, "fail");
    log.child({ service: "t" }).warn("w");
  });
});
