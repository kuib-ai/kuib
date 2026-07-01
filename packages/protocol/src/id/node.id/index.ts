// @context @journal/protocol-design
import { z } from "zod";

const NodeID = z.string().min(1).brand("NodeID");
type NodeID = z.infer<typeof NodeID>;

export default NodeID;
export type { NodeID };
