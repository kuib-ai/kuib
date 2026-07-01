import { describe, it, expect } from "vitest";
import Env from "@kuib-ai/env";

describe("bootstrapEnv", () => {
  it("applies defaults when no vars are set", () => {
    const config = Env.bootstrapEnv("test");
    expect(config.KUIB_MODEL_BASE_URL).toBe("http://localhost:11434/v1");
    expect(config.KUIB_MODEL_API_KEY).toBe("ollama");
  });

  it("reads an overriding value from process.env", () => {
    process.env["KUIB_MODEL_ID"] = "llama3:8b";
    const config = Env.bootstrapEnv("test");
    expect(config.KUIB_MODEL_ID).toBe("llama3:8b");
    delete process.env["KUIB_MODEL_ID"];
  });
});
