// @claim infra
import bootstrapEnv from "./bootstrap.env/index.ts";
import findWorkspaceRoot from "./workspace.root/index.ts";
import resolveDir from "./resolve.dir/index.ts";
import resolveDirs from "./resolve.dirs/index.ts";

// @claim infra/package-exports
const Env = {
  bootstrapEnv,
  findWorkspaceRoot,
  resolveDir,
  resolveDirs,
};

export default Env;
