// @claim core/daemon-file-procedures
import { homedir } from "node:os";
import { join } from "node:path";

// @claim core/daemon-file-procedures
const expandHomePath = function (path: string): string {
  if (path === "~") {
    return homedir();
  }
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
};

export default expandHomePath;
