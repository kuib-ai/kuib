import { describe, it, expect } from "bun:test";
import resolveModelConfig from "./index";

const base = {
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
  anthropicApiKey: undefined as string | undefined,
  groqApiKey: "gsk-test" as string | undefined,
};

describe("resolveModelConfig", function () {
  it("resolves groq/<model> with the groq key", function () {
    const config = resolveModelConfig({
      ...base,
      model: "groq/moonshotai/kimi-k2-instruct-0905",
    });
    expect(config.npm).toBe("@ai-sdk/groq");
    expect(config.modelID).toBe("moonshotai/kimi-k2-instruct-0905");
    expect(config.options.apiKey).toBe("gsk-test");
  });

  it("resolves anthropic/<model> with the anthropic key", function () {
    const config = resolveModelConfig({
      ...base,
      model: "anthropic/claude-opus-4-8",
      anthropicApiKey: "sk-ant-test",
    });
    expect(config.npm).toBe("@ai-sdk/anthropic");
    expect(config.modelID).toBe("claude-opus-4-8");
    expect(config.options.apiKey).toBe("sk-ant-test");
    expect(config.options.baseURL).toBe(undefined);
  });

  it("throws when anthropic is selected without KUIB_ANTHROPIC_API_KEY", function () {
    expect(function () {
      return resolveModelConfig({
        ...base,
        model: "anthropic/claude-opus-4-8",
      });
    }).toThrow(/KUIB_ANTHROPIC_API_KEY is required/);
  });

  it("treats an empty KUIB_ANTHROPIC_API_KEY as missing", function () {
    expect(function () {
      return resolveModelConfig({
        ...base,
        model: "anthropic/claude-opus-4-8",
        anthropicApiKey: "",
      });
    }).toThrow(/KUIB_ANTHROPIC_API_KEY is required/);
  });

  it("resolves openai-compatible/<model> keeping the base transport vars", function () {
    const config = resolveModelConfig({
      ...base,
      model: "openai-compatible/qwen3.5:9b",
    });
    expect(config.npm).toBe("@ai-sdk/openai-compatible");
    expect(config.modelID).toBe("qwen3.5:9b");
    expect(config.options.baseURL).toBe("http://localhost:11434/v1");
  });

  it("requires a base URL for an openai-compatible model", function () {
    expect(function () {
      return resolveModelConfig({
        ...base,
        model: "openai-compatible/qwen3.5:9b",
        baseURL: undefined,
      });
    }).toThrow(/model\.base_url or KUIB_MODEL_BASE_URL is required/);
  });

  it("throws on a selector without a slash", function () {
    expect(function () {
      return resolveModelConfig({ ...base, model: "anthropic" });
    }).toThrow(/must be "<provider>\/<model>"/);
  });

  it("throws on an unknown provider id", function () {
    expect(function () {
      return resolveModelConfig({ ...base, model: "mystery/model-1" });
    }).toThrow(/unknown provider/);
  });
});
