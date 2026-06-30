// @context @journal/protocol-design
import { z } from "zod";
import ToolCallPending from "../tool.call.pending";
import ToolCallCompleted from "../tool.call.completed";
import ToolCallError from "../tool.call.error";

const ToolCallState = z.discriminatedUnion("status", [
  ToolCallPending,
  ToolCallCompleted,
  ToolCallError,
]);
type ToolCallState = z.infer<typeof ToolCallState>;

export default ToolCallState;
export type { ToolCallState };
