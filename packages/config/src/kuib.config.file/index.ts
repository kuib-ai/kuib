// @context @journal/architecture-overview @journal/provider-architecture
import { z } from "zod";
import Std from "@kuib-ai/std";

const NodeConfigFile = z
  .object({
    label: z.string().min(1).optional(),
  })
  .strict()
  .prefault({});

const TargetConfigFile = z
  .object({
    node: z.string().min(1).optional(),
  })
  .strict()
  .prefault({});

const ModelConfigFile = z
  .object({
    default: z.string().min(1).default("groq/llama-3.3-70b-versatile"),
    base_url: z.url().optional(),
  })
  .strict()
  .prefault({});

const LoggingConfigFile = z
  .object({
    level: z.enum(Std.LogLevelEnum).default(Std.LogLevelEnum.INFO),
  })
  .strict()
  .prefault({});

const TelemetryConfigFile = z
  .object({
    endpoint: z.url().optional(),
  })
  .strict()
  .prefault({});

const WebConfigFile = z
  .object({
    port: z.coerce.number().int().positive().default(4321),
  })
  .strict()
  .prefault({});

const SecurityConfigFile = z
  .object({
    profile: z
      .enum(["development", "production", "readonly"])
      .default("development"),
  })
  .strict()
  .prefault({});

const KuibConfigFile = z
  .object({
    node: NodeConfigFile,
    target: TargetConfigFile,
    model: ModelConfigFile,
    logging: LoggingConfigFile,
    telemetry: TelemetryConfigFile,
    web: WebConfigFile,
    security: SecurityConfigFile,
  })
  .strict();
type KuibConfigFile = z.infer<typeof KuibConfigFile>;

export default KuibConfigFile;
export type { KuibConfigFile };
