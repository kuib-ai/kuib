import { describe, it, expect } from "bun:test";
import resolveModelConfig from "./index";

const base = {
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
  modelID: "gemma3:12b",
  anthropicApiKey: undefined as string | undefined,
};

describe("resolveModelConfig", () => {
  it("defaults to openai-compatible from the base vars when no selector is set", () => {
    const config = resolveModelConfig({ ...base, model: undefined });
    expect(config.npm).toBe("@ai-sdk/openai-compatible");
    expect(config.modelID).toBe("gemma3:12b");
    expect(config.options.baseURL).toBe("http://localhost:11434/v1");
    expect(config.options.apiKey).toBe("ollama");
  });

  it("resolves anthropic/<model> with the anthropic key", () => {
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

  it("throws when anthropic is selected without KUIB_ANTHROPIC_API_KEY", () => {
    expect(() =>
      resolveModelConfig({ ...base, model: "anthropic/claude-opus-4-8" }),
    ).toThrow(/KUIB_ANTHROPIC_API_KEY is required/);
  });

  it("treats an empty KUIB_ANTHROPIC_API_KEY as missing", () => {
    expect(() =>
      resolveModelConfig({
        ...base,
        model: "anthropic/claude-opus-4-8",
        anthropicApiKey: "",
      }),
    ).toThrow(/KUIB_ANTHROPIC_API_KEY is required/);
  });

  it("resolves openai-compatible/<model> keeping the base transport vars", () => {
    const config = resolveModelConfig({
      ...base,
      model: "openai-compatible/qwen3.5:9b",
    });
    expect(config.npm).toBe("@ai-sdk/openai-compatible");
    expect(config.modelID).toBe("qwen3.5:9b");
    expect(config.options.baseURL).toBe("http://localhost:11434/v1");
  });

  it("throws on a selector without a slash", () => {
    expect(() => resolveModelConfig({ ...base, model: "anthropic" })).toThrow(
      /must be "<provider>\/<model>"/,
    );
  });

  it("throws on an unknown provider id", () => {
    expect(() =>
      resolveModelConfig({ ...base, model: "mystery/model-1" }),
    ).toThrow(/unknown provider/);
  });
});
