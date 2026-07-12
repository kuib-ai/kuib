// @context @journal/host-layer
import { z } from "zod";
import Env from "@kuib-ai/env";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";
import Daemon from "@kuib-ai/daemon";
import Std from "@kuib-ai/std";

const TuiEnvSchema = z.object({
  KUIB_TRACE_ENDPOINT: z.url().default("http://cornelius:6006"),
  KUIB_TRACE_SERVICE: z.string().default("kuib-engine"),
  KUIB_DB_PATH: z.string().default(() => EventLogSqlite.resolveDbPath()),
  KUIB_SESSION_ID: z.string().default("default"),
  KUIB_NODE_LABEL: z.string().default(() => Daemon.resolveNodeLabel()),
  KUIB_TARGET_NODE: z.string().default(() => Daemon.resolveNodeLabel()),
  KUIB_MODEL: z.string().optional(),
  KUIB_MODEL_BASE_URL: z.url().default("http://localhost:11434/v1"),
  KUIB_MODEL_API_KEY: z.string().default("ollama"),
  KUIB_MODEL_ID: z.string().default("llama-3.3-70b-versatile"),
  KUIB_GROQ_API_KEY: z.string().optional(),
  KUIB_ANTHROPIC_API_KEY: z.string().optional(),
  KUIB_DAEMON_URL: z.url().optional(),
  KUIB_DAEMON_SOCKET: z
    .string()
    .default(() => Daemon.resolveDaemonSocketPath()),
  KUIB_MESH_CONFIG: z.string().default(() => Daemon.resolveMeshConfigPath()),
  KUIB_LOG_PATH: z.string().optional(),
  KUIB_LOG_LEVEL: z.enum(Std.LogLevelEnum).default(Std.LogLevelEnum.INFO),
});

const env = Env.bootstrapEnv(TuiEnvSchema);
export default env;
