// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import ToolCallID from "../../id/tool.call.id";

const ToolCallStarted = z.object({
  type: z.literal(EventTypeEnum.TOOL_CALL_STARTED),
  callID: ToolCallID,
});
type ToolCallStarted = z.infer<typeof ToolCallStarted>;

export default ToolCallStarted;
export type { ToolCallStarted };
