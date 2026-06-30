// @context @journal/protocol-design
import { z } from "zod";

const ToolCallID = z.string().min(1).brand("ToolCallID");
type ToolCallID = z.infer<typeof ToolCallID>;

export default ToolCallID;
export type { ToolCallID };
