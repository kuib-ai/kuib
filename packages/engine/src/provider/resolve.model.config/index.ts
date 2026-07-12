// @context @journal/provider-architecture
import Protocol from "@kuib-ai/protocol";
import type { ModelConfig } from "@kuib-ai/protocol/provider/model.config";

type ResolveModelConfigParams = {
  model: string | undefined;
  baseURL: string;
  apiKey: string;
  modelID: string;
  anthropicApiKey: string | undefined;
  groqApiKey: string | undefined;
};

const requireKey = function (
  key: string | undefined,
  envName: string,
  providerID: string,
): string {
  if (key === undefined || key.length === 0) {
    throw new Error(
      `${envName} is required when KUIB_MODEL selects the ${providerID} provider`,
    );
  }
  return key;
};

const resolveModelConfig = function (
  params: ResolveModelConfigParams,
): ModelConfig {
  if (params.model === undefined || params.model.length === 0) {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/groq",
      modelID: params.modelID,
      options: {
        apiKey: requireKey(params.groqApiKey, "KUIB_GROQ_API_KEY", "groq"),
      },
    });
  }
  const separator = params.model.indexOf("/");
  if (separator === -1) {
    throw new Error(
      `KUIB_MODEL must be "<provider>/<model>", got: ${params.model}`,
    );
  }
  const providerID = params.model.slice(0, separator);
  const modelID = params.model.slice(separator + 1);
  if (providerID === "groq") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/groq",
      modelID,
      options: {
        apiKey: requireKey(params.groqApiKey, "KUIB_GROQ_API_KEY", "groq"),
      },
    });
  }
  if (providerID === "anthropic") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/anthropic",
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
  if (providerID === "openai-compatible") {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/openai-compatible",
      modelID,
      options: { baseURL: params.baseURL, apiKey: params.apiKey },
    });
  }
  throw new Error(
    `unknown provider in KUIB_MODEL: ${providerID} (supported: groq, anthropic, openai-compatible)`,
  );
};

export default resolveModelConfig;
export type { ResolveModelConfigParams };
