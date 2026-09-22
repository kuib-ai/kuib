// @claim core/daemon-exec
import { z } from "zod";

// @claim core/daemon-exec
const ExecuteCommandOutput = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().int(),
});
type ExecuteCommandOutput = z.infer<typeof ExecuteCommandOutput>;

export default ExecuteCommandOutput;
export type { ExecuteCommandOutput };
