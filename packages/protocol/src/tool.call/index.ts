// @claim core/tool-call-states
import { ToolCallStatusEnum } from "./tool.call.status.enum/index.ts";
import { ToolCallKindEnum } from "./tool.call.kind.enum/index.ts";
import { ToolCallErrorReasonEnum } from "./tool.call.error.reason.enum/index.ts";
import ToolCallPending from "./tool.call.pending/index.ts";
import ToolCallCompleted from "./tool.call.completed/index.ts";
import ToolCallError from "./tool.call.error/index.ts";
import ToolCallState from "./tool.call.state/index.ts";

// @claim core/tool-call-states
const ToolCall = {
  ToolCallStatusEnum,
  ToolCallKindEnum,
  ToolCallErrorReasonEnum,
  ToolCallPending,
  ToolCallCompleted,
  ToolCallError,
  ToolCallState,
};

export default ToolCall;
