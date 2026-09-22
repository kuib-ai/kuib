// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const NodeID = z.string().min(1).brand("NodeID");
type NodeID = z.infer<typeof NodeID>;

export default NodeID;
export type { NodeID };
