// Demo: ambient log scopes with pino-pretty formatting.
// Run: deno run -A scripts/demo-log-scope.ts
import Std from "../packages/std/src/index.ts";
import createPinoLogger from "../packages/std/src/pino/index.ts";

const sleep = function (ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

const log = createPinoLogger({
  name: "demo-log-scope",
  level: Std.LogLevelEnum.INFO,
  pretty: true,
}).child({ script: "demo-log-scope" });

await Std.withScope({ runId: "run_42", sessionID: "sess_1" }, async () => {
  log.info("turn started");

  await Std.withScope({ toolName: "readFile", callID: "c1" }, async () => {
    await sleep(5);
    log.info({ path: "/tmp/x" }, "tool done");
  });

  Std.bindLogger(log).info("streaming (bound snapshot)");
});

log.info("outside any scope");
