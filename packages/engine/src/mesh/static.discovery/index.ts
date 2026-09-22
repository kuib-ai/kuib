// @claim core/discovery
import type { NodeID } from "@kuib-ai/protocol/id/node.id";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";

// @claim core/discovery
const createStaticDiscovery = function (
  descriptors: readonly NodeDescriptor[],
): DiscoveryPort {
  const byID = new Map<NodeID, NodeDescriptor>();
  for (const descriptor of descriptors) {
    byID.set(descriptor.nodeID, descriptor);
  }
  return {
    listNodes(): Promise<NodeDescriptor[]> {
      return Promise.resolve([...byID.values()]);
    },
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
