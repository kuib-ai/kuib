// @claim core/fs-io-schemas
import { z } from "zod";

// @claim core/fs-io-schemas
const ReadFileInput = z.object({
  path: z.string().min(1),
});
type ReadFileInput = z.infer<typeof ReadFileInput>;

export default ReadFileInput;
export type { ReadFileInput };
