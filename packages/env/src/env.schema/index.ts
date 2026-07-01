// @context @journal/provider-architecture
import { z } from "zod";

const EnvSchema = z.object({
  KUIB_MODEL_BASE_URL: z.string().url().default("http://localhost:11434/v1"),
  KUIB_MODEL_API_KEY: z.string().default("ollama"),
  KUIB_MODEL_ID: z.string().default("gemma3:12b"),
  KUIB_DAEMON_SOCKET: z.string().optional(),
  KUIB_DAEMON_URL: z.string().url().optional(),
  KUIB_DB_PATH: z.string().optional(),
  KUIB_SESSION_ID: z.string().default("default"),
});
type Env = z.infer<typeof EnvSchema>;

export default EnvSchema;
export type { Env };
