import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Protocol from "@kuib-ai/protocol";
import loadMeshConfig from "./index";

const dir = mkdtempSync(join(tmpdir(), "mesh-config-"));

describe("load mesh config", () => {
  it("returns [] when the path does not exist", () => {
    expect(loadMeshConfig(join(dir, "missing.toml"))).toEqual([]);
  });

  it("parses node descriptors from valid TOML", () => {
    const path = join(dir, "valid.toml");
    writeFileSync(
      path,
      [
        "[[nodes]]",
        'nodeID = "node-1"',
        'osUser = "alice"',
        'machineID = "machine-1"',
        'capabilities = ["exec"]',
      ].join("\n"),
    );
    const nodes = loadMeshConfig(path);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.nodeID).toBe(Protocol.ID.NodeID.parse("node-1"));
    expect(nodes[0]?.capabilities).toEqual(["exec"]);
  });

  it("throws when the config is invalid", () => {
    const path = join(dir, "invalid.toml");
    writeFileSync(path, ["[[nodes]]", 'osUser = "bob"'].join("\n"));
    expect(() => loadMeshConfig(path)).toThrow();
  });
});
