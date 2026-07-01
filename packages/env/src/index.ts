// @context @journal/provider-architecture
import bootstrapEnv from "./bootstrap.env";
import EnvSchema from "./env.schema";
import resolveDbPath from "./db.path";
import resolveMeshConfigPath from "./mesh.config.path";
import resolveNodeLabel from "./node.label";
import findWorkspaceRoot from "./workspace.root";

const Env = {
  bootstrapEnv,
  EnvSchema,
  resolveDbPath,
  resolveMeshConfigPath,
  resolveNodeLabel,
  findWorkspaceRoot,
};

export default Env;
