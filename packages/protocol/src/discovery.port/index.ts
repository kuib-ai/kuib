// @claim core/protocol-ports
import type { NodeID } from "../id/node.id/index.ts";
import type { NodeDescriptor } from "../node/node.descriptor/index.ts";

// @claim core/protocol-ports
interface DiscoveryPort {
  listNodes(): Promise<NodeDescriptor[]>;
  resolve(nodeID: NodeID): Promise<NodeDescriptor>;
}

export type { DiscoveryPort };
