// @context @journal/provider-architecture
import { z } from "zod";

const ModelConfig = z.object({
  npm: z.string().min(1),
  modelID: z.string().min(1),
  options: z
    .object({
      apiKey: z.string().optional(),
      baseURL: z.string().url().optional(),
    })
    .catchall(z.unknown()),
});
type ModelConfig = z.infer<typeof ModelConfig>;

export default ModelConfig;
export type { ModelConfig };
