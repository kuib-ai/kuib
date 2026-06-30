// @context @journal/architecture-overview
import { z } from "zod";

const ReadFileOutput = z.object({
  content: z.string(),
});
type ReadFileOutput = z.infer<typeof ReadFileOutput>;

export default ReadFileOutput;
export type { ReadFileOutput };
