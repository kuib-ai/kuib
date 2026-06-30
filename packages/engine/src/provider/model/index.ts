// @context @journal/provider-architecture
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

type ModelConfig = {
  baseURL: string;
  apiKey: string;
  modelID: string;
};

const createModel = function (config: ModelConfig): LanguageModel {
  const provider = createOpenAICompatible({
    name: "kuib",
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  return provider(config.modelID);
};

export default createModel;
export type { ModelConfig };
