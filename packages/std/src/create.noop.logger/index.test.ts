import { describe, it } from "bun:test";
import createNoopLogger from "./index";

describe("createNoopLogger", () => {
  it("accepts log calls without throwing", () => {
    const log = createNoopLogger();
    log.info("hello");
    log.error({ code: "x" }, "fail");
    log.child({ service: "t" }).warn("w");
  });
});
