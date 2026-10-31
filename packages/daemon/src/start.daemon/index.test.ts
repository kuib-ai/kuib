import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "node:path";
import createSocketPath from "@kuib-ai/testing/create.socket.path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";

const entry = join(import.meta.dirname!, "index.ts");

const runDaemonLine = async function (
  env: Record<string, string>,
  cwd: string,
): Promise<string> {
  const proc = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", entry],
    env,
    cwd,
    stdout: "piped",
    stderr: "null",
  }).spawn();
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
  await proc.status;
  return buffer.slice(0, buffer.indexOf("\n"));
};

describe("start.daemon main", function () {
  it("resolves the configured socket and omits the tcp suffix when no port is set", async function () {
    using dir = createTempDir();
    using socket = createSocketPath();
    const socketPath = socket.path;
    const line = await runDaemonLine(
      { KUIB_DAEMON_SOCKET: socketPath },
      dir.path,
    );
    expect(line).toBe(`kuib daemon → ${socketPath}`);
  });

  it("coerces KUIB_DAEMON_PORT to a number and appends the tcp suffix", async function () {
    using dir = createTempDir();
    using socket = createSocketPath();
    const socketPath = socket.path;
    const port = 20000 + (process.pid % 20000);
    const line = await runDaemonLine(
      {
        KUIB_DAEMON_SOCKET: socketPath,
        KUIB_DAEMON_PORT: `${port}`,
      },
      dir.path,
    );
    expect(line).toBe(`kuib daemon → ${socketPath} + tcp :${port}`);
  });
});
