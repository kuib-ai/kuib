import { describe, it, expect } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Protocol from "@kuib-ai/protocol";
import createPinoLogger from "./index";
import { LogLevelEnum } from "../log.level.enum";

describe("createPinoLogger", () => {
  it("writes structured lines to a file destination", () => {
    const dir = mkdtempSync(join(tmpdir(), "kuib-log-"));
    const destination = join(dir, "kuib.log");
    const log = createPinoLogger({
      name: "test",
      level: LogLevelEnum.INFO,
      destination,
    });

    log.info({ phase: "boot" }, "started");
    log.error(
      {
        err: Protocol.Error.ErrorDaemonUnreachable.parse({
          code: Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE,
          message: "socket down",
          endpoint: "/tmp/x.sock",
        }),
      },
      "daemon failed",
    );

    const lines = readFileSync(destination, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(lines).toHaveLength(2);
    expect(lines[0]?.msg).toBe("started");
    expect(lines[0]?.phase).toBe("boot");
    expect(lines[0]?.name).toBe("test");
    expect(lines[1]?.msg).toBe("daemon failed");
    expect(lines[1]?.err).toMatchObject({
      code: Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE,
      message: "socket down",
      endpoint: "/tmp/x.sock",
    });
  });
});
