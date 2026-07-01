// @context @journal/distributed-mesh-state
import { z } from "zod";
import Protocol from "@kuib-ai/protocol";

const MeshConfig = z.object({
  nodes: z.array(Protocol.Node.NodeDescriptor).default([]),
});
type MeshConfig = z.infer<typeof MeshConfig>;

export default MeshConfig;
export type { MeshConfig };
