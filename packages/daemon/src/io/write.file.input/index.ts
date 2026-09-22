// @context @journal/domains/core#^C037
import { z } from "zod";

const WriteFileInput = z.object({
  path: z.string().min(1),
  content: z.string(),
});
type WriteFileInput = z.infer<typeof WriteFileInput>;

export default WriteFileInput;
export type { WriteFileInput };
