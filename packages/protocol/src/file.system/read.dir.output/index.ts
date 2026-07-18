// @context @journal/tool-system
import { z } from "zod";

const ReadDirOutput = z.object({
  content: z.string(),
});
type ReadDirOutput = z.infer<typeof ReadDirOutput>;

export default ReadDirOutput;
export type { ReadDirOutput };
