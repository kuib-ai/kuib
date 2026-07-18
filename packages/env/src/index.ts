// @context @journal/application-directories
import bootstrapEnv from "./bootstrap.env";
import findWorkspaceRoot from "./workspace.root";
import resolveDir from "./resolve.dir";
import resolveDirs from "./resolve.dirs";

const Env = {
  bootstrapEnv,
  findWorkspaceRoot,
  resolveDir,
  resolveDirs,
};

export default Env;
