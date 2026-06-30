// @context @journal/protocol-design
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum";
import PartBase from "../part.base";
import ToolCallID from "../../id/tool.call.id";
import ToolCallState from "../../tool.call/tool.call.state";

const PartToolCall = PartBase.extend({
  type: z.literal(PartTypeEnum.TOOL_CALL),
  callID: ToolCallID,
  tool: z.string(),
  state: ToolCallState,
});
type PartToolCall = z.infer<typeof PartToolCall>;

export default PartToolCall;
export type { PartToolCall };
