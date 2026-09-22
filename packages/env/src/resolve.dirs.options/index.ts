// @claim infra/base-dirs
import { z } from "zod";

// @claim infra/base-dirs
const ResolveDirsOptions = z.object({
  dev: z.boolean().optional(),
  cwd: z.string().optional(),
  platform: z.enum(["darwin", "linux", "win32"]).optional(),
});
type ResolveDirsOptions = z.infer<typeof ResolveDirsOptions>;

export default ResolveDirsOptions;
export type { ResolveDirsOptions };
