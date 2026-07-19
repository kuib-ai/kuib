import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";

const self: NodeDescriptor = {
  nodeID: Protocol.ID.NodeID.parse("self-node"),
  osUser: "alice",
  machineID: "machine-1",
  capabilities: [],
};

describe("local only discovery", function () {
  it("lists only self", async function () {
    const discovery = Engine.Mesh.createLocalOnlyDiscovery(self);
    const nodes = await discovery.listNodes();
    expect(nodes).toEqual([self]);
  });

  it("resolves any nodeID to self", async function () {
    const discovery = Engine.Mesh.createLocalOnlyDiscovery(self);
    const other = Protocol.ID.NodeID.parse("some-other-node");
    const resolved = await discovery.resolve(other);
    expect(resolved).toBe(self);
  });
});
