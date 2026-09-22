// @claim infra/base-dirs
import { join } from "node:path";
import findWorkspaceRoot from "../workspace.root/index.ts";

// @claim infra/base-dirs
const resolveDevRoot = function (cwd: string = process.cwd()): string {
  return join(findWorkspaceRoot(cwd), "dist");
};

export default resolveDevRoot;
