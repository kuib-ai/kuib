// @context @journal/architecture-overview @journal/provider-architecture
import { z } from "zod";
import Std from "@kuib-ai/std";

const KuibConfig = z.object({
  node: z.object({ label: z.string().min(1) }),
  target: z.object({ node: z.string().min(1) }),
  model: z.object({
    default: z.string().min(1),
    baseURL: z.url().optional(),
  }),
  logging: z.object({
    level: z.enum(Std.LogLevelEnum),
  }),
  telemetry: z.object({
    endpoint: z.url().optional(),
  }),
  web: z.object({
    port: z.number().int().positive(),
  }),
  security: z.object({
    profile: z.enum(["development", "production", "readonly"]),
  }),
});
type KuibConfig = z.infer<typeof KuibConfig>;

export default KuibConfig;
export type { KuibConfig };
