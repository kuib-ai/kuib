import { describe, it } from "@std/testing/bdd";
import createNoopLogger from "./index.ts";

describe("createNoopLogger", function () {
  it("accepts log calls without throwing", function () {
    const log = createNoopLogger();
    log.info("hello");
    log.error({ code: "x" }, "fail");
    log.child({ service: "t" }).warn("w");
  });
});
