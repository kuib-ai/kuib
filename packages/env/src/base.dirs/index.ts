// @context @journal/application-directories
import { z } from "zod";

const BaseDirs = z.object({
  config: z.string().min(1),
  data: z.string().min(1),
  state: z.string().min(1),
  cache: z.string().min(1),
  runtime: z.string().min(1),
});
type BaseDirs = z.infer<typeof BaseDirs>;

export default BaseDirs;
export type { BaseDirs };
