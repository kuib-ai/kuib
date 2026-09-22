// @claim core/fs-io-schemas
import { z } from "zod";

// @claim core/fs-io-schemas
const ReadDirOutput = z.object({
  content: z.string(),
});
type ReadDirOutput = z.infer<typeof ReadDirOutput>;

export default ReadDirOutput;
export type { ReadDirOutput };
