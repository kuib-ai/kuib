// @claim core/fs-io-schemas
import { z } from "zod";

// @claim core/fs-io-schemas
const ReadFileOutput = z.object({
  content: z.string(),
});
type ReadFileOutput = z.infer<typeof ReadFileOutput>;

export default ReadFileOutput;
export type { ReadFileOutput };
