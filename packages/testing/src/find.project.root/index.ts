// @claim infra/testing-helpers
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

// @claim infra/testing-helpers
const findProjectRoot = function (start: string): string | null {
  let current = start;
  while (true) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
};

export default findProjectRoot;
