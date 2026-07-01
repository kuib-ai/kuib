// @context @journal/provider-architecture
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import EnvSchema from "../env.schema";
import type { Env } from "../env.schema";
import findWorkspaceRoot from "../workspace.root";

const bootstrapEnv = function (
  mode: string = process.env["NODE_ENV"] ?? "development",
): Env {
  const root = findWorkspaceRoot(process.cwd());
  const candidates = [resolve(root, ".env"), resolve(root, `.env.${mode}`)];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path, override: true });
    }
  }
  return EnvSchema.parse(process.env);
};

export default bootstrapEnv;
