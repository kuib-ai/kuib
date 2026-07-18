// @context @journal/architecture-overview @journal/application-directories
import { existsSync, readFileSync } from "node:fs";
import { hostname, userInfo } from "node:os";
import Env from "@kuib-ai/env";
import { z } from "zod";
import KuibConfigFile from "../kuib.config.file";
import KuibConfigSchema from "../kuib.config";
import resolveAppPaths from "../resolve.app.paths";
import type { AppPaths } from "../app.paths";
import type { ConfigOverrides } from "../config.overrides";
import type { KuibConfig } from "../kuib.config";

const BootstrapEnv = z.object({
  NODE_ENV: z.string().optional(),
  KUIB_CONFIG: z.string().optional(),
  KUIB_MESH_CONFIG: z.string().optional(),
  KUIB_DB_PATH: z.string().optional(),
  KUIB_LOG_PATH: z.string().optional(),
  KUIB_DAEMON_SOCKET: z.string().optional(),
  KUIB_ENGINE_SOCKET: z.string().optional(),
  KUIB_SESSION_ID: z.string().default("default"),
  KUIB_NODE_LABEL: z.string().optional(),
  KUIB_TARGET_NODE: z.string().optional(),
  KUIB_MODEL: z.string().optional(),
  KUIB_MODEL_BASE_URL: z.url().optional(),
  KUIB_MODEL_API_KEY: z.string().optional(),
  KUIB_MODEL_ID: z.string().optional(),
  KUIB_GROQ_API_KEY: z.string().optional(),
  KUIB_ANTHROPIC_API_KEY: z.string().optional(),
  KUIB_LOG_LEVEL: z.string().optional(),
  KUIB_TRACE_ENDPOINT: z.url().optional(),
  KUIB_WEB_PORT: z.string().optional(),
  KUIB_SECURITY_PROFILE: z.string().optional(),
  KUIB_DAEMON_URL: z.url().optional(),
  KUIB_DAEMON_PORT: z.coerce.number().int().positive().optional(),
  KUIB_WEB_TAILSCALE_IP: z.string().optional(),
  KUIB_WEB_DEV: z.string().optional(),
});

type BootstrapConfigOptions = {
  cwd?: string;
  mode?: string;
  cli?: ConfigOverrides;
};

type ProviderSecrets = {
  groqApiKey?: string;
  anthropicApiKey?: string;
  modelApiKey?: string;
};

type RuntimeConfig = {
  mode: string;
  sessionID: string;
  daemonURL?: string;
  daemonPort?: number;
  webTailscaleIP?: string;
  webDev: boolean;
};

type BootstrapConfig = {
  config: KuibConfig;
  paths: AppPaths;
  secrets: ProviderSecrets;
  runtime: RuntimeConfig;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = function (value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const merge = function (base: unknown, overlay: unknown): unknown {
  if (!isRecord(base) || !isRecord(overlay)) {
    return overlay;
  }
  const result: UnknownRecord = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    result[key] = key in result ? merge(result[key], value) : value;
  }
  return result;
};

const set = function (
  target: UnknownRecord,
  section: string,
  key: string,
  value: unknown,
): void {
  if (value === undefined) {
    return;
  }
  const existing = target[section];
  const values = isRecord(existing) ? existing : {};
  values[key] = value;
  target[section] = values;
};

const loadFile = function (path: string): unknown {
  if (!existsSync(path)) {
    return {};
  }
  return Bun.TOML.parse(readFileSync(path, "utf8"));
};

const bootstrapConfig = function (
  options: BootstrapConfigOptions = {},
): BootstrapConfig {
  const cwd = options.cwd ?? process.cwd();
  const requestedMode =
    options.mode ?? process.env["NODE_ENV"] ?? "development";
  const env = Env.bootstrapEnv(BootstrapEnv, requestedMode, cwd);
  const mode = env.NODE_ENV ?? requestedMode;
  const cli = options.cli ?? {};
  const pathOverrides: ConfigOverrides = {
    configFile: cli.configFile ?? env.KUIB_CONFIG,
    meshConfigFile: cli.meshConfigFile ?? env.KUIB_MESH_CONFIG,
    database: cli.database ?? env.KUIB_DB_PATH,
    log: cli.log ?? env.KUIB_LOG_PATH,
    daemonSocket: cli.daemonSocket ?? env.KUIB_DAEMON_SOCKET,
    engineSocket: cli.engineSocket ?? env.KUIB_ENGINE_SOCKET,
  };
  const paths = resolveAppPaths(pathOverrides, {
    cwd,
    dev: mode !== "production",
  });

  const envLayer: UnknownRecord = {};
  set(envLayer, "node", "label", env.KUIB_NODE_LABEL);
  set(envLayer, "target", "node", env.KUIB_TARGET_NODE);
  const compatibilityModel =
    env.KUIB_MODEL ??
    (env.KUIB_MODEL_ID !== undefined || env.KUIB_MODEL_BASE_URL !== undefined
      ? `openai-compatible/${env.KUIB_MODEL_ID ?? "llama-3.3-70b-versatile"}`
      : undefined);
  set(envLayer, "model", "default", compatibilityModel);
  set(envLayer, "model", "base_url", env.KUIB_MODEL_BASE_URL);
  set(envLayer, "logging", "level", env.KUIB_LOG_LEVEL);
  set(envLayer, "telemetry", "endpoint", env.KUIB_TRACE_ENDPOINT);
  set(envLayer, "web", "port", env.KUIB_WEB_PORT);
  set(envLayer, "security", "profile", env.KUIB_SECURITY_PROFILE);

  const cliLayer: UnknownRecord = {};
  set(cliLayer, "target", "node", cli.targetNode);
  set(cliLayer, "model", "default", cli.model);
  set(cliLayer, "logging", "level", cli.logLevel);
  set(cliLayer, "web", "port", cli.webPort);

  const merged = merge(merge(loadFile(paths.configFile), envLayer), cliLayer);
  const file = KuibConfigFile.parse(merged);
  const localLabel = file.node.label ?? `${userInfo().username}@${hostname()}`;
  const config = KuibConfigSchema.parse({
    node: { label: localLabel },
    target: { node: file.target.node ?? localLabel },
    model: {
      default: file.model.default,
      baseURL: file.model.base_url,
    },
    logging: file.logging,
    telemetry: file.telemetry,
    web: file.web,
    security: file.security,
  });

  return {
    config,
    paths,
    secrets: {
      groqApiKey: env.KUIB_GROQ_API_KEY,
      anthropicApiKey: env.KUIB_ANTHROPIC_API_KEY,
      modelApiKey: env.KUIB_MODEL_API_KEY,
    },
    runtime: {
      mode,
      sessionID: cli.sessionID ?? env.KUIB_SESSION_ID,
      daemonURL: env.KUIB_DAEMON_URL,
      daemonPort: env.KUIB_DAEMON_PORT,
      webTailscaleIP: env.KUIB_WEB_TAILSCALE_IP,
      webDev: env.KUIB_WEB_DEV !== undefined,
    },
  };
};

export default bootstrapConfig;
export type {
  BootstrapConfig,
  BootstrapConfigOptions,
  ProviderSecrets,
  RuntimeConfig,
};
