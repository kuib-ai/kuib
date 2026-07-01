// @context @journal/host-layer
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import Env from "@kuib-ai/env";

const resolveDaemonSocketPath = function (configured?: string): string {
  if (configured) {
    return configured;
  }
  const base =
    process.env["NODE_ENV"] === "production"
      ? join(homedir(), ".kuib")
      : join(Env.findWorkspaceRoot(process.cwd()), "dist");
  mkdirSync(base, { recursive: true });
  return join(base, "daemon.sock");
};

export default resolveDaemonSocketPath;
