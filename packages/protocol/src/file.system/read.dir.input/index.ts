// @claim core/fs-io-schemas
import { z } from "zod";

// @claim core/fs-io-schemas
const ReadDirInput = z.object({
  path: z.string().min(1),
});
type ReadDirInput = z.infer<typeof ReadDirInput>;

export default ReadDirInput;
export type { ReadDirInput };
