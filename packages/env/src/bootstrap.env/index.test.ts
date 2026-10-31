import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import overrideEnv from "@kuib-ai/testing/override.env";
import changeCwd from "@kuib-ai/testing/change.cwd";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import bootstrapEnv from "./index.ts";
import { z } from "zod";

const TestSchema = z.object({
  KUIB_MODEL_BASE_URL: z.url().default("http://localhost:11434/v1"),
  KUIB_SESSION_ID: z.string().default("default"),
});

let workspace = "";
let resources: DisposableStack;

beforeEach(function () {
  resources = new DisposableStack();
  resources.use(overrideEnv());
  workspace = resources.use(createTempDir("kuib-env-")).path;
  writeFileSync(resolve(workspace, "pnpm-workspace.yaml"), "packages: []\n");
  resources.use(changeCwd(workspace));
});

afterEach(function () {
  resources.dispose();
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
    using _env = overrideEnv({ KUIB_MODEL_BASE_URL: "not-a-url" });

    expect(function () {
      return bootstrapEnv(TestSchema, "test");
    }).toThrow();
  });

  it("keeps OS environment above mode and base dotenv files", function () {
    writeFileSync(resolve(workspace, ".env"), "KUIB_SESSION_ID=base\n");
    writeFileSync(resolve(workspace, ".env.test"), "KUIB_SESSION_ID=mode\n");
    using _env = overrideEnv({ KUIB_SESSION_ID: "os" });

    expect(bootstrapEnv(TestSchema, "test").KUIB_SESSION_ID).toBe("os");
  });

  it("keeps the mode dotenv file above the base dotenv file", function () {
    writeFileSync(resolve(workspace, ".env"), "KUIB_SESSION_ID=base\n");
    writeFileSync(resolve(workspace, ".env.test"), "KUIB_SESSION_ID=mode\n");
    using _env = overrideEnv({ KUIB_SESSION_ID: undefined });

    expect(bootstrapEnv(TestSchema, "test").KUIB_SESSION_ID).toBe("mode");
  });
});
