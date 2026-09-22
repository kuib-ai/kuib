// @claim core/protocol-parts
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import PartBase from "../part.base/index.ts";
import ToolCallID from "../../id/tool.call.id/index.ts";
import ToolCallState from "../../tool.call/tool.call.state/index.ts";

// @claim core/protocol-parts
const PartToolCall = PartBase.extend({
  type: z.literal(PartTypeEnum.TOOL_CALL),
  callID: ToolCallID,
  tool: z.string(),
  state: ToolCallState,
});
type PartToolCall = z.infer<typeof PartToolCall>;

export default PartToolCall;
export type { PartToolCall };
