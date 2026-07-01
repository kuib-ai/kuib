// @context @journal/distributed-mesh-state
import type { NodeID } from "@kuib-ai/protocol/id/node.id";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";

const createStaticDiscovery = function (
  descriptors: readonly NodeDescriptor[],
): DiscoveryPort {
  const byID = new Map<NodeID, NodeDescriptor>();
  for (const descriptor of descriptors) {
    byID.set(descriptor.nodeID, descriptor);
  }
  return {
    resolve(nodeID: NodeID): Promise<NodeDescriptor> {
      const descriptor = byID.get(nodeID);
      if (descriptor === undefined) {
        return Promise.reject(new Error(`unknown node: ${nodeID}`));
      }
      return Promise.resolve(descriptor);
    },
  };
};

export default createStaticDiscovery;
