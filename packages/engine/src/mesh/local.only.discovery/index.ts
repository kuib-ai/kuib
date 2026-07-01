// @context @journal/distributed-mesh-state
import type { NodeID } from "@kuib-ai/protocol/id/node.id";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";

const createLocalOnlyDiscovery = function (
  self: NodeDescriptor,
): DiscoveryPort {
  return {
    listNodes(): Promise<NodeDescriptor[]> {
      return Promise.resolve([self]);
    },
    resolve(_nodeID: NodeID): Promise<NodeDescriptor> {
      return Promise.resolve(self);
    },
  };
};

export default createLocalOnlyDiscovery;
