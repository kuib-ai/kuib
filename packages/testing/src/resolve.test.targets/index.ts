// @claim infra/test-runner
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import findProjectRoot from "../find.project.root/index.ts";

type TestTarget = { project: string; name: string; files: string[] };

const projectName = function (project: string): string {
  const manifest = JSON.parse(
    readFileSync(join(project, "package.json"), "utf8"),
  );
  return typeof manifest.name === "string" ? manifest.name : project;
};

// @claim infra/test-runner
const resolveTestTargets = function (
  cwd: string,
  paths: string[],
  workspaceRoot: string,
): TestTarget[] {
  const targets = new Map<string, TestTarget>();
  for (const path of paths) {
    const absolute = resolve(cwd, path);
    if (!existsSync(absolute)) {
      throw new Error(`no such path: ${path}`);
    }
    const project = findProjectRoot(absolute);
    if (project === null || resolve(project) === resolve(workspaceRoot)) {
      throw new Error(`${path} is not inside a project`);
    }
    const owner = resolve(project);
    const target = targets.get(owner) ?? {
      project: owner,
      name: projectName(owner),
      files: [],
    };
    if (absolute !== owner) {
      target.files.push(relative(owner, absolute));
    }
    targets.set(owner, target);
  }
  return [...targets.values()];
};

export default resolveTestTargets;
export type { TestTarget };
