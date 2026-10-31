// @claim infra/test-runner
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PROJECT_FOLDERS = ["apps", "packages"];

// @claim infra/test-runner
const resolveTestProjects = function (workspaceRoot: string): string[] {
  const nested = PROJECT_FOLDERS.flatMap(function (folder) {
    const parent = join(workspaceRoot, folder);
    return existsSync(parent)
      ? readdirSync(parent).map(function (name) {
          return join(parent, name);
        })
      : [];
  });
  return [...nested, join(workspaceRoot, "tooling")].filter(function (project) {
    return existsSync(join(project, "package.json"));
  });
};

export default resolveTestProjects;
