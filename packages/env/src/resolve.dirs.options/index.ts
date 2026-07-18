// @context @journal/application-directories
import { z } from "zod";

const ResolveDirsOptions = z.object({
  dev: z.boolean().optional(),
  cwd: z.string().optional(),
  platform: z.enum(["darwin", "linux", "win32"]).optional(),
});
type ResolveDirsOptions = z.infer<typeof ResolveDirsOptions>;

export default ResolveDirsOptions;
export type { ResolveDirsOptions };
