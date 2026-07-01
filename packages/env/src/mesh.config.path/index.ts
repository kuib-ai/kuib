// @context @journal/distributed-mesh-state
import { homedir } from "node:os";
import { join } from "node:path";

const resolveMeshConfigPath = function (configured?: string): string {
  if (configured) {
    return configured;
  }
  const base = join(
    process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config"),
    "kuib",
  );
  return join(base, "mesh.config.toml");
};

export default resolveMeshConfigPath;
