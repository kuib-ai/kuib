// @context @journal/distributed-mesh-state
import { z } from "zod";
import NodeID from "../../id/node.id";
import AnyEndpoint from "../../endpoint/endpoint.any";

const NodeDescriptor = z.object({
  nodeID: NodeID,
  endpoint: AnyEndpoint,
});
type NodeDescriptor = z.infer<typeof NodeDescriptor>;

export default NodeDescriptor;
export type { NodeDescriptor };
