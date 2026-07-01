// @context @journal/provider-architecture
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

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

export default findWorkspaceRoot;
