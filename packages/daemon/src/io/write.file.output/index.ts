// @claim core/daemon-file-procedures
import { z } from "zod";

// @claim core/daemon-file-procedures
const WriteFileOutput = z.object({
  success: z.literal(true),
});
type WriteFileOutput = z.infer<typeof WriteFileOutput>;

export default WriteFileOutput;
export type { WriteFileOutput };
