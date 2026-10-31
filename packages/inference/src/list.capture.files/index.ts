// @claim core/provider-captures
import { readdirSync } from "node:fs";
import { join } from "node:path";

const listCaptureFiles = function (root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(function (entry) {
    const path = join(root, entry.name);
    return entry.isDirectory() ? listCaptureFiles(path) : [path];
  });
};

export default listCaptureFiles;
