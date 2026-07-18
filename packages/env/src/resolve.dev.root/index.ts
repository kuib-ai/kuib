// @context @journal/application-directories
import { join } from "node:path";
import findWorkspaceRoot from "../workspace.root";

const resolveDevRoot = function (cwd: string = process.cwd()): string {
  return join(findWorkspaceRoot(cwd), "dist");
};

export default resolveDevRoot;
