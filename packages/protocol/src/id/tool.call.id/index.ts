// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const ToolCallID = z.string().min(1).brand("ToolCallID");
type ToolCallID = z.infer<typeof ToolCallID>;

export default ToolCallID;
export type { ToolCallID };
