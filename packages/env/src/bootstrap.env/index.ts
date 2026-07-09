// @context @journal/provider-architecture
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import findWorkspaceRoot from "../workspace.root";
import type { ZodTypeAny, z } from "zod";

const bootstrapEnv = function <T extends ZodTypeAny>(
  schema: T,
  mode: string = process.env["NODE_ENV"] ?? "development",
): z.infer<T> {
  const root = findWorkspaceRoot(process.cwd());
  const candidates = [resolve(root, ".env"), resolve(root, `.env.${mode}`)];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path, override: true, quiet: true });
    }
  }
  return schema.parse(process.env);
};

export default bootstrapEnv;
