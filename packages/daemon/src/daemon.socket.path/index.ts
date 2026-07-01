// @context @journal/host-layer
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const resolveDaemonSocketPath = function (configured?: string): string {
  if (configured) {
    return configured;
  }
  const base =
    process.env["NODE_ENV"] === "production"
      ? join(homedir(), ".kuib")
      : join(process.cwd(), "dist");
  mkdirSync(base, { recursive: true });
  return join(base, "daemon.sock");
};

export default resolveDaemonSocketPath;
