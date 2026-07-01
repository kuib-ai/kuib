// @context @journal/distributed-mesh-state
import type { NodeID } from "../id/node.id";
import type { NodeDescriptor } from "../node/node.descriptor";

interface DiscoveryPort {
  resolve(nodeID: NodeID): Promise<NodeDescriptor>;
}

export type { DiscoveryPort };
