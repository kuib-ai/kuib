// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";

const ToolCallStarted = z.object({
  type: z.literal(EventTypeEnum.TOOL_CALL_STARTED),
  callID: ToolCallID,
  name: z.string().min(1).optional(),
  input: z.string().optional(),
});
type ToolCallStarted = z.infer<typeof ToolCallStarted>;

export default ToolCallStarted;
export type { ToolCallStarted };
