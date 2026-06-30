// @context @journal/architecture-overview
import { z } from "zod";

const ExecuteCommandInput = z.object({
  command: z.string().min(1),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});
type ExecuteCommandInput = z.infer<typeof ExecuteCommandInput>;

export default ExecuteCommandInput;
export type { ExecuteCommandInput };
