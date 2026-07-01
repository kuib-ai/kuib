import { describe, it, expect } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Daemon from "@kuib-ai/daemon";

const caller = Daemon.createDaemonCaller({});

describe("daemon procedures", () => {
  it("executeCommand returns stdout and exitCode 0", async () => {
    const res = await caller.executeCommand({ command: "echo hello" });
    expect(res.stdout.trim()).toBe("hello");
    expect(res.exitCode).toBe(0);
  });

  it("executeCommand surfaces a nonzero exitCode", async () => {
    const res = await caller.executeCommand({ command: "exit 3" });
    expect(res.exitCode).toBe(3);
  });

  it("writeFile then readFile round-trips content", async () => {
    const dir = await mkdtemp(join(tmpdir(), "kuib-daemon-"));
    const path = join(dir, "note.txt");
    const written = await caller.writeFile({ path, content: "data" });
    expect(written.success).toBe(true);
    const read = await caller.readFile({ path });
    expect(read.content).toBe("data");
    await rm(dir, { recursive: true, force: true });
  });

  it("readFile throws on a missing file", async () => {
    await expect(
      caller.readFile({ path: "/nonexistent/kuib/x" }),
    ).rejects.toThrow();
  });
});
