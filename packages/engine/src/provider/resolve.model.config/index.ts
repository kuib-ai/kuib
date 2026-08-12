// @context @journal/provider-architecture
import Protocol from "@kuib-ai/protocol";
import type { ModelConfig } from "@kuib-ai/protocol/provider/model.config";

type ResolveModelConfigParams = {
  model: string;
  baseURL: string | undefined;
  apiKey: string | undefined;
  anthropicApiKey: string | undefined;
  groqApiKey: string | undefined;
  metaApiKey: string | undefined;
  mimoApiKey: string | undefined;
  mimoBaseURL: string | undefined;
};

const META_BASE_URL = "https://api.meta.ai/v1";
const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";

const requireKey = function (
  key: string | undefined,
  name: string,
  providerID: string,
): string {
  if (key === undefined || key.length === 0) {
    throw new Error(
      `${name} is required when model.default selects the ${providerID} provider`,
    );
  }
  return key;
};

const resolveModelConfig = function (
  params: ResolveModelConfigParams,
): ModelConfig {
  const separator = params.model.indexOf("/");
  if (separator === -1) {
    throw new Error(
      `model.default must be "<provider>/<model>", got: ${params.model}`,
    );
  }
  const providerID = params.model.slice(0, separator);
  const modelID = params.model.slice(separator + 1);
  if (providerID === "groq") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/groq",
      providerID,
      modelID,
      options: {
        apiKey: requireKey(params.groqApiKey, "KUIB_GROQ_API_KEY", "groq"),
      },
    });
  }
  if (providerID === "anthropic") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/anthropic",
      providerID,
      modelID,
      options: {
        apiKey: requireKey(
          params.anthropicApiKey,
          "KUIB_ANTHROPIC_API_KEY",
          "anthropic",
        ),
      },
    });
  }
  if (providerID === "meta") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/openai-compatible",
      providerID,
      modelID,
      options: {
        baseURL: META_BASE_URL,
        apiKey: requireKey(params.metaApiKey, "KUIB_META_API_KEY", "meta"),
      },
    });
  }
  if (providerID === "mimo") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/openai-compatible",
      providerID,
      modelID,
      options: {
        baseURL: params.mimoBaseURL ?? MIMO_BASE_URL,
        apiKey: requireKey(params.mimoApiKey, "KUIB_MIMO_API_KEY", "mimo"),
      },
      providerOptions: { thinking: { type: "enabled" } },
    });
  }
  if (providerID === "openai-compatible") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/openai-compatible",
      providerID,
      modelID,
      options: {
        baseURL: requireKey(
          params.baseURL,
          "model.base_url or KUIB_MODEL_BASE_URL",
          "openai-compatible",
        ),
        apiKey: params.apiKey,
      },
      providerOptions: { reasoningEffort: "none" },
    });
  }
  throw new Error(
    `unknown provider in model.default: ${providerID} (supported: groq, anthropic, meta, mimo, openai-compatible)`,
  );
};

export default resolveModelConfig;
export type { ResolveModelConfigParams };
