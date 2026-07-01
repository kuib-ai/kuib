// @context @journal/distributed-mesh-state
import { z } from "zod";
import NodeID from "../../id/node.id";
import AnyEndpoint from "../../endpoint/endpoint.any";

const NodeDescriptor = z.object({
  nodeID: NodeID,
  osUser: z.string(),
  machineID: z.string(),
  capabilities: z.array(z.string()).default([]),
  endpoint: AnyEndpoint.optional(),
});
type NodeDescriptor = z.infer<typeof NodeDescriptor>;

export default NodeDescriptor;
export type { NodeDescriptor };
