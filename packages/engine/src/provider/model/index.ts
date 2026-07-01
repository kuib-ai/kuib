// @context @journal/provider-architecture
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import type { ModelConfig } from "@kuib-ai/protocol/provider/model.config";

type ModelFactory = (config: ModelConfig) => LanguageModel;

const openAICompatibleFactory: ModelFactory = function (config) {
  const baseURL = config.options.baseURL;
  if (baseURL === undefined) {
    throw new Error(`options.baseURL is required for ${config.npm}`);
  }
  const provider = createOpenAICompatible({
    ...config.options,
    name: "kuib",
    baseURL,
  });
  return provider(config.modelID);
};

const anthropicFactory: ModelFactory = function (config) {
  const provider = createAnthropic({ ...config.options });
  return provider(config.modelID);
};

const FACTORIES: Record<string, ModelFactory> = {
  "@ai-sdk/openai-compatible": openAICompatibleFactory,
  "@ai-sdk/anthropic": anthropicFactory,
};

const createModel = function (config: ModelConfig): LanguageModel {
  const factory = FACTORIES[config.npm];
  if (factory === undefined) {
    throw new Error(
      `unknown provider package: ${config.npm} (supported: ${Object.keys(FACTORIES).join(", ")})`,
    );
  }
  return factory(config);
};

export default createModel;
