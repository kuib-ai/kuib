// @context @journal/protocol-design
import { z } from "zod";
import ToolCallPending from "../tool.call.pending/index.ts";
import ToolCallCompleted from "../tool.call.completed/index.ts";
import ToolCallError from "../tool.call.error/index.ts";

const ToolCallState = z.discriminatedUnion("status", [
  ToolCallPending,
  ToolCallCompleted,
  ToolCallError,
]);
type ToolCallState = z.infer<typeof ToolCallState>;

export default ToolCallState;
export type { ToolCallState };
