// @claim infra/test-runner
import { join } from "node:path";
import resolveTestTask from "../resolve.test.task/index.ts";
import runTestProcess from "../run.test.process/index.ts";
import type { TestRequest } from "../parse.test.request/index.ts";

type TestProjectsInput = {
  workspaceRoot: string;
  request: TestRequest;
  names?: string[];
  extra?: string[];
  nxFlags?: string[];
};

// @claim infra/test-runner
const runTestProjects = async function (
  input: TestProjectsInput,
): Promise<number> {
  const task = process.env["NX_TASK_TARGET_PROJECT"];
  if (task !== undefined) {
    throw new Error(
      `the test runner was asked to fan out through Nx from inside the Nx task of ${task}; a project's test script runs in its project folder.`,
    );
  }
  const target = resolveTestTask(input.request.kind);
  const scope = input.request.affected ? "affected" : "run-many";
  const names = input.names ?? [];
  const forwarded = [...input.request.flags, ...(input.extra ?? [])];
  return await runTestProcess(
    join(input.workspaceRoot, "node_modules", ".bin", "nx"),
    [
      scope,
      "-t",
      target,
      ...(names.length === 0 ? [] : ["-p", names.join(",")]),
      ...(input.nxFlags ?? []),
      ...(forwarded.length === 0 ? [] : ["--", ...forwarded]),
    ],
    { cwd: input.workspaceRoot },
  );
};

export default runTestProjects;
export type { TestProjectsInput };
