// @context @journal/tool-system
import { z } from "zod";

const ReadDirInput = z.object({
  path: z.string().min(1),
});
type ReadDirInput = z.infer<typeof ReadDirInput>;

export default ReadDirInput;
export type { ReadDirInput };
