import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import resolveDaemonClient, { type EnvArgs } from "./index";

const writeMeshConfig = function (nodeID: string, url: string): string {
  const dir = mkdtempSync(join(tmpdir(), "kuib-mesh-"));
  const path = join(dir, "mesh.config.toml");
  writeFileSync(
    path,
    [
      "[[nodes]]",
      `nodeID = "${nodeID}"`,
      'osUser = "u"',
      'machineID = "m"',
      "",
      "[nodes.endpoint]",
      'kind = "tcp"',
      `url = "${url}"`,
      "",
    ].join("\n"),
    "utf8",
  );
  return path;
};

const localEnv = function (overrides: Partial<EnvArgs> = {}): EnvArgs {
  return {
    KUIB_TARGET_NODE: "local",
    KUIB_MESH_CONFIG: "/nonexistent/mesh.config.toml",
    KUIB_DAEMON_URL: "http://127.0.0.1:8080",
    KUIB_DAEMON_SOCKET: "/tmp/daemon.sock",
    ...overrides,
  };
};

describe("resolveDaemonClient", () => {
  it("takes the local path when KUIB_TARGET_NODE equals the local label", async () => {
    const client = await resolveDaemonClient(localEnv(), "local");
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path resolving the target NodeID from the mesh config", async () => {
    const path = writeMeshConfig("remote", "http://127.0.0.1:9999");
    const client = await resolveDaemonClient(
      localEnv({ KUIB_TARGET_NODE: "remote", KUIB_MESH_CONFIG: path }),
      "local",
    );
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path and rejects when the target node is not in the mesh config", async () => {
    await expect(
      resolveDaemonClient(localEnv({ KUIB_TARGET_NODE: "remote" }), "local"),
    ).rejects.toThrow("unknown node: remote");
  });
});
