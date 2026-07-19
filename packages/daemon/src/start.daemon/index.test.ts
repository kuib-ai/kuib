import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const entry = join(import.meta.dir, "index.ts");

const runDaemonLine = async function (
  env: Record<string, string>,
): Promise<string> {
  const proc = Bun.spawn(["bun", entry], {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "ignore",
  });
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!buffer.includes("\n")) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
  }
  await reader.cancel();
  proc.kill();
  await proc.exited;
  return buffer.slice(0, buffer.indexOf("\n"));
};

describe("start.daemon main", function () {
  it("resolves the configured socket and omits the tcp suffix when no port is set", async function () {
    const socketPath = join(mkdtempSync(join(tmpdir(), "kuib-")), "d.sock");
    const line = await runDaemonLine({ KUIB_DAEMON_SOCKET: socketPath });
    expect(line).toBe(`kuib daemon → ${socketPath}`);
  });

  it("coerces KUIB_DAEMON_PORT to a number and appends the tcp suffix", async function () {
    const socketPath = join(mkdtempSync(join(tmpdir(), "kuib-")), "d.sock");
    const port = 20000 + (process.pid % 20000);
    const line = await runDaemonLine({
      KUIB_DAEMON_SOCKET: socketPath,
      KUIB_DAEMON_PORT: `${port}`,
    });
    expect(line).toBe(`kuib daemon → ${socketPath} + tcp :${port}`);
  });
});
