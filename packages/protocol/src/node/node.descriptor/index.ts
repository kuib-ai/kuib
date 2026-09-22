// @context @journal/domains/core#^C015
import { z } from "zod";
import NodeID from "../../id/node.id/index.ts";
import AnyEndpoint from "../../endpoint/endpoint.any/index.ts";

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
