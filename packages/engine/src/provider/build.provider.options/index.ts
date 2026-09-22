// @context @journal/domains/core#^C031
import type { streamText } from "ai";
import type { ModelConfig } from "@kuib-ai/protocol/provider/model.config";

type ProviderOptions = NonNullable<
  Parameters<typeof streamText>[0]["providerOptions"]
>;

const SDK_NAMES: Record<string, string> = {
  "@ai-sdk/openai-compatible": "kuib",
  "@ai-sdk/anthropic": "anthropic",
  "@ai-sdk/groq": "groq",
};

const buildProviderOptions = function (config: ModelConfig): ProviderOptions {
  const name = SDK_NAMES[config.npm];
  if (name === undefined || Object.keys(config.providerOptions).length === 0) {
    return {};
  }
  return { [name]: config.providerOptions };
};

export default buildProviderOptions;
export type { ProviderOptions };
