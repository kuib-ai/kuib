// @context @journal/distributed-mesh-state
import type { NodeID } from "@kuib-ai/protocol/id/node.id";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";

const createLocalOnlyDiscovery = function (
  endpoint: AnyEndpoint,
): DiscoveryPort {
  return {
    resolve(nodeID: NodeID): Promise<NodeDescriptor> {
      return Promise.resolve({ nodeID, endpoint });
    },
  };
};

export default createLocalOnlyDiscovery;
