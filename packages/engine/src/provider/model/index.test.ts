import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import createModel from "./index";

describe("createModel", () => {
  it("builds an openai-compatible model from the factory map", () => {
    const model = createModel(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/openai-compatible",
        modelID: "gemma3:12b",
        options: { baseURL: "http://localhost:11434/v1", apiKey: "ollama" },
      }),
    );
    expect(model).toBeDefined();
  });

  it("builds an anthropic model from the factory map", () => {
    const model = createModel(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/anthropic",
        modelID: "claude-opus-4-8",
        options: { apiKey: "sk-ant-test" },
      }),
    );
    expect(model).toBeDefined();
  });

  it("builds a groq model from the factory map", () => {
    const model = createModel(
      Protocol.Provider.ModelConfig.parse({
        npm: "@ai-sdk/groq",
        modelID: "llama-3.3-70b-versatile",
        options: { apiKey: "gsk-test" },
      }),
    );
    expect(model).toBeDefined();
  });

  it("throws on an unknown provider package", () => {
    expect(() =>
      createModel(
        Protocol.Provider.ModelConfig.parse({
          npm: "@ai-sdk/mystery",
          modelID: "m1",
          options: {},
        }),
      ),
    ).toThrow(/unknown provider package/);
  });

  it("throws when openai-compatible is missing baseURL", () => {
    expect(() =>
      createModel(
        Protocol.Provider.ModelConfig.parse({
          npm: "@ai-sdk/openai-compatible",
          modelID: "m1",
          options: { apiKey: "k" },
        }),
      ),
    ).toThrow(/baseURL is required/);
  });
});
