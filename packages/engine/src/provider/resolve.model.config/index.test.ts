import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import resolveModelConfig from "./index.ts";

const base = {
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
  anthropicApiKey: undefined as string | undefined,
  groqApiKey: "gsk-test" as string | undefined,
  metaApiKey: undefined as string | undefined,
  mimoApiKey: undefined as string | undefined,
  mimoBaseURL: undefined as string | undefined,
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

  it("resolves meta/<model> onto openai-compatible with the Meta base URL", function () {
    const config = resolveModelConfig({
      ...base,
      model: "meta/muse-spark-1.1",
      metaApiKey: "meta-test",
    });
    expect(config.npm).toBe("@ai-sdk/openai-compatible");
    expect(config.modelID).toBe("muse-spark-1.1");
    expect(config.options.apiKey).toBe("meta-test");
    expect(config.options.baseURL).toBe("https://api.meta.ai/v1");
  });

  it("ignores KUIB_MODEL_BASE_URL when meta is selected", function () {
    const config = resolveModelConfig({
      ...base,
      model: "meta/muse-spark-1.2",
      metaApiKey: "meta-test",
    });
    expect(config.options.baseURL).toBe("https://api.meta.ai/v1");
  });

  it("does not force reasoningEffort on meta", function () {
    const config = resolveModelConfig({
      ...base,
      model: "meta/muse-spark-1.1",
      metaApiKey: "meta-test",
    });
    expect(config.providerOptions).toEqual({});
  });

  it("keeps reasoningEffort none for generic openai-compatible endpoints", function () {
    const config = resolveModelConfig({
      ...base,
      model: "openai-compatible/gemma4:12b",
    });
    expect(config.providerOptions).toEqual({ reasoningEffort: "none" });
  });

  it("throws when meta is selected without KUIB_META_API_KEY", function () {
    expect(function () {
      return resolveModelConfig({ ...base, model: "meta/muse-spark-1.1" });
    }).toThrow(/KUIB_META_API_KEY is required/);
  });

  it("resolves mimo/<model> onto the token-plan base URL with thinking enabled", function () {
    const config = resolveModelConfig({
      ...base,
      model: "mimo/mimo-v2.5-pro",
      mimoApiKey: "mimo-test",
    });
    expect(config.npm).toBe("@ai-sdk/openai-compatible");
    expect(config.modelID).toBe("mimo-v2.5-pro");
    expect(config.options.apiKey).toBe("mimo-test");
    expect(config.options.baseURL).toBe(
      "https://token-plan-sgp.xiaomimimo.com/v1",
    );
    expect(config.providerOptions).toEqual({ thinking: { type: "enabled" } });
  });

  it("lets KUIB_MIMO_BASE_URL override the plan region", function () {
    const config = resolveModelConfig({
      ...base,
      model: "mimo/mimo-v2.5",
      mimoApiKey: "mimo-test",
      mimoBaseURL: "https://token-plan-usa.xiaomimimo.com/v1",
    });
    expect(config.options.baseURL).toBe(
      "https://token-plan-usa.xiaomimimo.com/v1",
    );
  });

  it("ignores KUIB_MODEL_BASE_URL when mimo is selected", function () {
    const config = resolveModelConfig({
      ...base,
      model: "mimo/mimo-v2.5-pro",
      mimoApiKey: "mimo-test",
    });
    expect(config.options.baseURL).toBe(
      "https://token-plan-sgp.xiaomimimo.com/v1",
    );
  });

  it("throws when mimo is selected without KUIB_MIMO_API_KEY", function () {
    expect(function () {
      return resolveModelConfig({ ...base, model: "mimo/mimo-v2.5-pro" });
    }).toThrow(/KUIB_MIMO_API_KEY is required/);
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
