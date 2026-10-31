import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

it("keeps recorder units outside the product barrel import graph", function () {
  const visited = new Set<string>();
  const pending = [resolve(import.meta.dirname!, "index.ts")];
  while (pending.length > 0) {
    const path = pending.pop()!;
    if (visited.has(path)) continue;
    visited.add(path);
    const source = readFileSync(path, "utf8");
    expect(source).not.toContain("@claim core/provider-captures");
    for (const match of source.matchAll(
      /(?:import|export)\s+(?:[^;]*?\s+from\s+)?["']([^"']+)["']/g,
    )) {
      const specifier = match[1]!;
      if (specifier.startsWith("."))
        pending.push(resolve(dirname(path), specifier));
      if (specifier.startsWith("@kuib-ai/inference/")) {
        pending.push(
          resolve(
            import.meta.dirname!,
            specifier.slice("@kuib-ai/inference/".length),
            "index.ts",
          ),
        );
      }
    }
  }
});
