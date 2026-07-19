import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import createTransportFactory from "./index";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import type { NodeID } from "@kuib-ai/protocol/id/node.id";

const nodeID = Protocol.ID.NodeID.parse("n1");

const makeDiscovery = function (descriptor: NodeDescriptor): DiscoveryPort {
  return {
    listNodes: function () {
      return Promise.resolve([descriptor]);
    },
    resolve: function (_id: NodeID) {
      return Promise.resolve(descriptor);
    },
  };
};

describe("mesh transportFactory", function () {
  it("resolves a descriptor with an endpoint and creates a daemon client", async function () {
    const descriptor = Protocol.Node.NodeDescriptor.parse({
      nodeID,
      osUser: "u",
      machineID: "m",
      endpoint: { kind: "tcp", url: "http://localhost:1" },
    });
    const transportFactory = createTransportFactory(makeDiscovery(descriptor));

    const client = await transportFactory(nodeID);

    expect(client).toBeDefined();
    expect(typeof client.readFile.query).toBe("function");
  });

  it("throws when the resolved descriptor has no endpoint", async function () {
    const descriptor = Protocol.Node.NodeDescriptor.parse({
      nodeID,
      osUser: "u",
      machineID: "m",
    });
    const transportFactory = createTransportFactory(makeDiscovery(descriptor));

    await expect(transportFactory(nodeID)).rejects.toThrow(
      "node has no endpoint",
    );
  });
});
