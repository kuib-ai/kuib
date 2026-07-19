import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import bootstrapEnv from ".";
import { z } from "zod";

const TestSchema = z.object({
  KUIB_MODEL_BASE_URL: z.url().default("http://localhost:11434/v1"),
  KUIB_SESSION_ID: z.string().default("default"),
});

const originalCwd = process.cwd();
const originalEnv = { ...process.env };
let workspace = "";

const resetEnv = function (): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
};

beforeEach(function () {
  workspace = mkdtempSync(resolve(tmpdir(), "kuib-env-"));
  writeFileSync(resolve(workspace, "pnpm-workspace.yaml"), "packages: []\n");
  process.chdir(workspace);
});

afterEach(function () {
  process.chdir(originalCwd);
  rmSync(workspace, { recursive: true, force: true });
  resetEnv();
});

describe("bootstrapEnv", function () {
  it("returns a valid parsed Env with the expected keys and types", function () {
    const env = bootstrapEnv(TestSchema, "test");

    expect(typeof env.KUIB_MODEL_BASE_URL).toBe("string");
    expect(typeof env.KUIB_SESSION_ID).toBe("string");
  });

  it("skips a missing .env.<mode> file and still returns a parsed Env", function () {
    const env = bootstrapEnv(TestSchema, "nonexistent-mode");

    expect(function () {
      return TestSchema.parse(env);
    }).not.toThrow();
  });

  it("throws when the resolved env is invalid", function () {
    process.env["KUIB_MODEL_BASE_URL"] = "not-a-url";

    expect(function () {
      return bootstrapEnv(TestSchema, "test");
    }).toThrow();
  });

  it("keeps OS environment above mode and base dotenv files", function () {
    writeFileSync(resolve(workspace, ".env"), "KUIB_SESSION_ID=base\n");
    writeFileSync(resolve(workspace, ".env.test"), "KUIB_SESSION_ID=mode\n");
    process.env["KUIB_SESSION_ID"] = "os";

    expect(bootstrapEnv(TestSchema, "test").KUIB_SESSION_ID).toBe("os");
  });

  it("keeps the mode dotenv file above the base dotenv file", function () {
    writeFileSync(resolve(workspace, ".env"), "KUIB_SESSION_ID=base\n");
    writeFileSync(resolve(workspace, ".env.test"), "KUIB_SESSION_ID=mode\n");
    delete process.env["KUIB_SESSION_ID"];

    expect(bootstrapEnv(TestSchema, "test").KUIB_SESSION_ID).toBe("mode");
  });
});
