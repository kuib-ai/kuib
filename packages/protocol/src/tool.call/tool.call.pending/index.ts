// @context @journal/protocol-design
import { z } from "zod";
import { ToolCallStatusEnum } from "../tool.call.status.enum";

const ToolCallPending = z.object({
  status: z.literal(ToolCallStatusEnum.PENDING),
  input: z.record(z.string(), z.unknown()),
  title: z.string(),
  startedAt: z.number(),
});
type ToolCallPending = z.infer<typeof ToolCallPending>;

export default ToolCallPending;
export type { ToolCallPending };
