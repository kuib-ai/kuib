// @context @journal/provider-architecture
import Protocol from "@kuib-ai/protocol";
import type { ModelConfig } from "@kuib-ai/protocol/provider/model.config";

type ResolveModelConfigParams = {
  model: string | undefined;
  baseURL: string;
  apiKey: string;
  modelID: string;
  anthropicApiKey: string | undefined;
};

const resolveModelConfig = function (
  params: ResolveModelConfigParams,
): ModelConfig {
  if (params.model === undefined || params.model.length === 0) {
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/openai-compatible",
      modelID: params.modelID,
      options: { baseURL: params.baseURL, apiKey: params.apiKey },
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
  if (providerID === "anthropic") {
    if (
      params.anthropicApiKey === undefined ||
      params.anthropicApiKey.length === 0
    ) {
      throw new Error(
        "KUIB_ANTHROPIC_API_KEY is required when KUIB_MODEL selects the anthropic provider",
      );
    }
    return Protocol.Provider.ModelConfig.parse({
      npm: "@ai-sdk/anthropic",
      modelID,
      options: { apiKey: params.anthropicApiKey },
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
    `unknown provider in KUIB_MODEL: ${providerID} (supported: anthropic, openai-compatible)`,
  );
};

export default resolveModelConfig;
export type { ResolveModelConfigParams };
