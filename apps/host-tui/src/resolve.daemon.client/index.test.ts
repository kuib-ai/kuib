import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import resolveDaemonClient, { type DaemonConfig } from "./index";

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

const localConfig = function (
  overrides: Partial<DaemonConfig> = {},
): DaemonConfig {
  return {
    targetNode: "local",
    meshConfigFile: "/nonexistent/mesh.config.toml",
    daemonURL: "http://127.0.0.1:8080",
    daemonSocket: "/tmp/daemon.sock",
    ...overrides,
  };
};

describe("resolveDaemonClient", () => {
  it("takes the local path when targetNode equals the local label", async () => {
    const client = await resolveDaemonClient(localConfig(), "local");
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path resolving the target NodeID from the mesh config", async () => {
    const path = writeMeshConfig("remote", "http://127.0.0.1:9999");
    const client = await resolveDaemonClient(
      localConfig({ targetNode: "remote", meshConfigFile: path }),
      "local",
    );
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path and rejects when the target node is not in the mesh config", async () => {
    await expect(
      resolveDaemonClient(localConfig({ targetNode: "remote" }), "local"),
    ).rejects.toThrow("unknown node: remote");
  });
});
