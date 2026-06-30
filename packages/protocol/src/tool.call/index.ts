// @context @journal/protocol-design
import { ToolCallStatusEnum } from "./tool.call.status.enum";
import { ToolCallKindEnum } from "./tool.call.kind.enum";
import { ToolCallErrorReasonEnum } from "./tool.call.error.reason.enum";
import ToolCallPending from "./tool.call.pending";
import ToolCallCompleted from "./tool.call.completed";
import ToolCallError from "./tool.call.error";
import ToolCallState from "./tool.call.state";

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
