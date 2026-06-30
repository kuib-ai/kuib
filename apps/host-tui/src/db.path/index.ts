// @context @journal/host-layer
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const resolveDbPath = function (configured?: string): string {
  if (configured) {
    return configured;
  }
  const base =
    process.env["NODE_ENV"] === "production"
      ? join(
          process.env["XDG_DATA_HOME"] ?? join(homedir(), ".local", "share"),
          "kuib",
        )
      : join(process.cwd(), "dist");
  mkdirSync(base, { recursive: true });
  return join(base, "kuib.db");
};

export default resolveDbPath;
