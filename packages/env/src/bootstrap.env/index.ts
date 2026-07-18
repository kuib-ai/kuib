// @context @journal/provider-architecture
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import findWorkspaceRoot from "../workspace.root";
import type { ZodTypeAny, z } from "zod";

const bootstrapEnv = function <T extends ZodTypeAny>(
  schema: T,
  mode: string = process.env["NODE_ENV"] ?? "development",
  cwd: string = process.cwd(),
): z.infer<T> {
  const root = findWorkspaceRoot(cwd);
  const candidates = [resolve(root, `.env.${mode}`), resolve(root, ".env")];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path, override: false, quiet: true });
    }
  }
  return schema.parse(process.env);
};

export default bootstrapEnv;
