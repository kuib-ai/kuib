// @claim core/daemon-file-procedures
import { z } from "zod";

// @claim core/daemon-file-procedures
const WriteFileInput = z.object({
  path: z.string().min(1),
  content: z.string(),
});
type WriteFileInput = z.infer<typeof WriteFileInput>;

export default WriteFileInput;
export type { WriteFileInput };
