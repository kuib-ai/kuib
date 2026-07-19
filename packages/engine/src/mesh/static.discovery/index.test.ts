import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import createStaticDiscovery from "./index";

const makeDescriptor = function (id: string): NodeDescriptor {
  return Protocol.Node.NodeDescriptor.parse({
    nodeID: Protocol.ID.NodeID.parse(id),
    osUser: "alice",
    machineID: "m1",
  });
};

describe("createStaticDiscovery", function () {
  it("listNodes returns deduped descriptors keyed by nodeID", async function () {
    const first = makeDescriptor("n1");
    const duplicate = { ...makeDescriptor("n1"), osUser: "bob" };
    const second = makeDescriptor("n2");

    const discovery = createStaticDiscovery([first, duplicate, second]);
    const nodes = await discovery.listNodes();

    expect(nodes.length).toBe(2);
    expect(
      nodes
        .map(function (node) {
          return node.nodeID;
        })
        .sort(),
    ).toEqual([Protocol.ID.NodeID.parse("n1"), Protocol.ID.NodeID.parse("n2")]);
    const resolvedFirst = nodes.find(function (node) {
      return node.nodeID === first.nodeID;
    });
    expect(resolvedFirst?.osUser).toBe("bob");
  });

  it("resolve returns the descriptor for a known id", async function () {
    const descriptor = makeDescriptor("n1");
    const discovery = createStaticDiscovery([descriptor]);

    const resolved = await discovery.resolve(Protocol.ID.NodeID.parse("n1"));

    expect(resolved).toBe(descriptor);
  });

  it("resolve rejects with 'unknown node' for an unknown id", async function () {
    const discovery = createStaticDiscovery([makeDescriptor("n1")]);

    await expect(
      discovery.resolve(Protocol.ID.NodeID.parse("missing")),
    ).rejects.toThrow("unknown node: missing");
  });
});
