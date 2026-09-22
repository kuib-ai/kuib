// @context @journal/domains/core#^C006
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";

const ToolCallOutputDelta = z.object({
  type: z.literal(EventTypeEnum.TOOL_CALL_OUTPUT_DELTA),
  callID: ToolCallID,
  delta: z.string(),
});
type ToolCallOutputDelta = z.infer<typeof ToolCallOutputDelta>;

export default ToolCallOutputDelta;
export type { ToolCallOutputDelta };
