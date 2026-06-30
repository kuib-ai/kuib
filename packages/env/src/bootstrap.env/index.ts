// @context @journal/provider-architecture
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import EnvSchema from "../env.schema";
import type { Env } from "../env.schema";

const findWorkspaceRoot = function (start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
};

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
