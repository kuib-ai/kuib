// @context @journal/application-directories
import { z } from "zod";

const AppPaths = z.object({
  configFile: z.string().min(1),
  meshConfigFile: z.string().min(1),
  database: z.string().min(1),
  log: z.string().min(1),
  daemonSocket: z.string().min(1),
  engineSocket: z.string().min(1),
  cacheDir: z.string().min(1),
});
type AppPaths = z.infer<typeof AppPaths>;

export default AppPaths;
export type { AppPaths };
