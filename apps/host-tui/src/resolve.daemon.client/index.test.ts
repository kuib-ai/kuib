import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Env from "@kuib-ai/env";
import resolveDaemonClient from "./index";

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

describe("resolveDaemonClient", () => {
  it("takes the local path (KUIB_TARGET_NODE undefined) using the daemon endpoint", async () => {
    const env = Env.EnvSchema.parse({
      KUIB_DAEMON_URL: "http://127.0.0.1:8080",
    });
    const client = await resolveDaemonClient(env, "local");
    expect(client).toBeDefined();
  });

  it("treats KUIB_TARGET_NODE equal to the local label as the local path", async () => {
    const env = Env.EnvSchema.parse({
      KUIB_DAEMON_URL: "http://127.0.0.1:8080",
      KUIB_TARGET_NODE: "local",
      KUIB_MESH_CONFIG: "/nonexistent/mesh.config.toml",
    });
    const client = await resolveDaemonClient(env, "local");
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path resolving the target NodeID from the mesh config", async () => {
    const path = writeMeshConfig("remote", "http://127.0.0.1:9999");
    const env = Env.EnvSchema.parse({
      KUIB_TARGET_NODE: "remote",
      KUIB_MESH_CONFIG: path,
    });
    const client = await resolveDaemonClient(env, "local");
    expect(client).toBeDefined();
  });

  it("takes the remote mesh path and rejects when the target node is not in the mesh config", async () => {
    const env = Env.EnvSchema.parse({
      KUIB_TARGET_NODE: "remote",
      KUIB_MESH_CONFIG: "/nonexistent/mesh.config.toml",
    });
    await expect(resolveDaemonClient(env, "local")).rejects.toThrow(
      "unknown node: remote",
    );
  });
});
