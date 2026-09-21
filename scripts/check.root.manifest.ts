// Deno 2.9 copies pnpm-workspace.yaml into the root package.json when a
// root-level resolution error meets it. pnpm owns the workspace and catalog;
// fail check if that migration ever lands.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const leaked = ["workspaces", "catalog", "catalogs"].filter(function (key) {
  return key in manifest;
});

if (leaked.length > 0) {
  process.stderr.write(
    `root package.json gained ${leaked.join(", ")} (Deno's pnpm-workspace migration). Revert it; pnpm-workspace.yaml is the source of truth.\n`,
  );
  process.exit(1);
}
