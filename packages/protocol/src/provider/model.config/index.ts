// @context @journal/domains/core#^C017
import { z } from "zod";

const ModelConfig = z.object({
  npm: z.string().min(1),
  providerID: z.string().min(1),
  modelID: z.string().min(1),
  options: z
    .object({
      apiKey: z.string().optional(),
      baseURL: z.string().url().optional(),
    })
    .catchall(z.unknown()),
  providerOptions: z.record(z.string(), z.json()).default({}),
});
type ModelConfig = z.infer<typeof ModelConfig>;

export default ModelConfig;
export type { ModelConfig };
