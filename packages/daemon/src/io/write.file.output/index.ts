// @context @journal/architecture-overview
import { z } from "zod";

const WriteFileOutput = z.object({
  success: z.literal(true),
});
type WriteFileOutput = z.infer<typeof WriteFileOutput>;

export default WriteFileOutput;
export type { WriteFileOutput };
