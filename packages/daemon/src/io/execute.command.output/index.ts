// @context @journal/domains/core#^C038
import { z } from "zod";

const ExecuteCommandOutput = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().int(),
});
type ExecuteCommandOutput = z.infer<typeof ExecuteCommandOutput>;

export default ExecuteCommandOutput;
export type { ExecuteCommandOutput };
