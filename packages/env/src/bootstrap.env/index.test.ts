import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import bootstrapEnv from ".";
import EnvSchema from "../env.schema";

const originalCwd = process.cwd();
const originalEnv = { ...process.env };
let workspace = "";

const resetEnv = function (): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
};

beforeEach(() => {
  workspace = mkdtempSync(resolve(tmpdir(), "kuib-env-"));
  writeFileSync(resolve(workspace, "pnpm-workspace.yaml"), "packages: []\n");
  process.chdir(workspace);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(workspace, { recursive: true, force: true });
  resetEnv();
});

describe("EnvSchema", () => {
  it("applies defaults for the optional model keys on an empty object", () => {
    const env = EnvSchema.parse({});

    expect(env.KUIB_MODEL_BASE_URL).toBe("http://localhost:11434/v1");
    expect(env.KUIB_MODEL_API_KEY).toBe("ollama");
    expect(env.KUIB_MODEL_ID).toBe("gemma3:12b");
    expect(env.KUIB_SESSION_ID).toBe("default");
  });

  it("rejects a malformed base url", () => {
    expect(() =>
      EnvSchema.parse({ KUIB_MODEL_BASE_URL: "not-a-url" }),
    ).toThrow();
  });
});

describe("bootstrapEnv", () => {
  it("returns a valid parsed Env with the expected keys and types", () => {
    const env = bootstrapEnv("test");

    expect(typeof env.KUIB_MODEL_BASE_URL).toBe("string");
    expect(typeof env.KUIB_MODEL_API_KEY).toBe("string");
    expect(typeof env.KUIB_MODEL_ID).toBe("string");
    expect(typeof env.KUIB_SESSION_ID).toBe("string");
    expect(() => EnvSchema.parse(env)).not.toThrow();
  });

  it("skips a missing .env.<mode> file and still returns a parsed Env", () => {
    const env = bootstrapEnv("nonexistent-mode");

    expect(() => EnvSchema.parse(env)).not.toThrow();
  });

  it("throws when the resolved env is invalid", () => {
    process.env["KUIB_MODEL_BASE_URL"] = "not-a-url";

    expect(() => bootstrapEnv("test")).toThrow();
  });
});
