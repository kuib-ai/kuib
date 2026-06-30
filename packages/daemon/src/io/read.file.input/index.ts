// @context @journal/architecture-overview
import { z } from "zod";

const ReadFileInput = z.object({
  path: z.string().min(1),
});
type ReadFileInput = z.infer<typeof ReadFileInput>;

export default ReadFileInput;
export type { ReadFileInput };
