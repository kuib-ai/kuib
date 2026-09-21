import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import Protocol from "@kuib-ai/protocol";
import buildProviderOptions from "./index.ts";

describe("buildProviderOptions", function () {
  it("nests providerOptions under the sdk provider name", function () {
    const options = buildProviderOptions(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/openai-compatible",
        providerID: "openai-compatible",
        modelID: "gemma4:12b",
        options: { baseURL: "http://localhost:11434/v1" },
        providerOptions: { reasoningEffort: "none" },
      }),
    );
    expect(options).toEqual({ kuib: { reasoningEffort: "none" } });
  });

  it("returns an empty record when there are no providerOptions", function () {
    const options = buildProviderOptions(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/openai-compatible",
        providerID: "openai-compatible",
        modelID: "muse-spark-1.1",
        options: { baseURL: "https://api.meta.ai/v1" },
      }),
    );
    expect(options).toEqual({});
  });

  it("uses the anthropic sdk name", function () {
    const options = buildProviderOptions(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/anthropic",
        providerID: "anthropic",
        modelID: "claude-opus-4-8",
        options: { apiKey: "sk-ant-test" },
        providerOptions: { thinking: { type: "enabled" } },
      }),
    );
    expect(options).toEqual({ anthropic: { thinking: { type: "enabled" } } });
  });
});
