// @context @journal/provider-architecture
import { z } from "zod";

const EnvSchema = z.object({
  KUIB_MODEL: z.string().optional(),
  KUIB_MODEL_BASE_URL: z.string().url().default("http://localhost:11434/v1"),
  KUIB_MODEL_API_KEY: z.string().default("ollama"),
  KUIB_MODEL_ID: z.string().default("gemma3:12b"),
  KUIB_ANTHROPIC_API_KEY: z.string().optional(),
  KUIB_DAEMON_SOCKET: z.string().optional(),
  KUIB_DAEMON_PORT: z.coerce.number().int().positive().optional(),
  KUIB_DAEMON_URL: z.string().url().optional(),
  KUIB_DB_PATH: z.string().optional(),
  KUIB_SESSION_ID: z.string().default("default"),
  KUIB_NODE_LABEL: z.string().optional(),
  KUIB_MESH_CONFIG: z.string().optional(),
  KUIB_TARGET_NODE: z.string().optional(),
  KUIB_TRACE_ENDPOINT: z.string().url().optional(),
  KUIB_TRACE_SERVICE: z.string().optional(),
  KUIB_WEB_PORT: z.coerce.number().int().positive().default(4321),
  KUIB_WEB_TAILSCALE_IP: z.string().optional(),
  KUIB_WEB_DEV: z.string().optional(),
});
type Env = z.infer<typeof EnvSchema>;

export default EnvSchema;
export type { Env };
