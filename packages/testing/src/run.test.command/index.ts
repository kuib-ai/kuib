// @claim infra/test-runner
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import parseTestRequest from "../parse.test.request/index.ts";
import findProjectRoot from "../find.project.root/index.ts";
import resolveTestDepth from "../resolve.test.depth/index.ts";
import resolveTestTargets from "../resolve.test.targets/index.ts";
import runTestCoverage from "../run.test.coverage/index.ts";
import runTestProjects from "../run.test.projects/index.ts";
import runTestTarget from "../run.test.target/index.ts";
import { TestKindEnum } from "../test.kind.enum/index.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const USAGE = `Usage: pnpm test [paths…] [flags…]

  pnpm test                         every project, through Nx, cached
  pnpm test --affected              the projects affected against origin/master
  pnpm test packages/env            one project, through Nx, cached
  pnpm test packages/env/src/x      a file or folder, run directly
  pnpm test packages/env --filter "walks up"     one test by name
  pnpm test packages/env --watch                 watch a path
  pnpm test --coverage              coverage per project and a workspace total

Paths come first. Everything from the first flag on reaches \`deno test\`
untouched, except --affected, --coverage and --kind=test|live|bench.

Test processes share bounded slots in this workspace; a run beyond the
limit waits. The runner does not start inside a test.`;

// @claim infra/test-runner
const route = async function (argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }
  const nesting = resolveTestDepth(process.env);
  if (nesting.refusal !== null) {
    throw new Error(nesting.refusal);
  }
  const request = parseTestRequest(argv, nesting.depth);
  const cwd = process.cwd();
  if (request.coverage) {
    if (resolve(cwd) !== resolve(ROOT)) {
      throw new Error(
        "--coverage runs from the workspace root: pnpm test --coverage",
      );
    }
    return await runTestCoverage(request, ROOT);
  }
  if (
    resolve(cwd) === resolve(ROOT) &&
    (request.affected || request.paths.length === 0)
  ) {
    return await runTestProjects({ workspaceRoot: ROOT, request });
  }
  const project = findProjectRoot(cwd);
  if (project === null) {
    throw new Error(`${cwd} is not inside a project`);
  }
  const paths = request.paths.length === 0 ? [project] : request.paths;
  const targets = resolveTestTargets(cwd, paths, ROOT);
  const wholeProjects = targets.every(function (target) {
    return target.files.length === 0;
  });
  const viaNx = request.kind === null || request.kind === TestKindEnum.TEST;
  if (
    resolve(cwd) === resolve(ROOT) &&
    wholeProjects &&
    viaNx &&
    request.flags.length === 0
  ) {
    return await runTestProjects({
      workspaceRoot: ROOT,
      request,
      names: targets.map(function (target) {
        return target.name;
      }),
    });
  }
  let code = 0;
  for (const target of targets) {
    code = Math.max(code, await runTestTarget(target, request, ROOT));
  }
  return code;
};

// @claim infra/test-runner
const runTestCommand = async function (
  argv: string[] = process.argv.slice(2),
): Promise<number> {
  return await route(argv).catch(function (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  });
};

export default runTestCommand;
