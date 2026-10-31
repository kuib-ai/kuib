// @claim infra/coverage-report
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import reportTestCoverage from "../report.test.coverage/index.ts";
import resolveTestProjects from "../resolve.test.projects/index.ts";
import resolveTestTargets from "../resolve.test.targets/index.ts";
import resolveTestTask from "../resolve.test.task/index.ts";
import runTestProjects from "../run.test.projects/index.ts";
import runTestTarget from "../run.test.target/index.ts";
import type { TestRequest } from "../parse.test.request/index.ts";

const hasTestTarget = function (
  project: string,
  kind: TestKindEnum | null,
): boolean {
  const manifest = JSON.parse(
    readFileSync(join(project, "package.json"), "utf8"),
  );
  return manifest.scripts?.[resolveTestTask(kind)] !== undefined;
};

// @claim infra/coverage-report
const runTestCoverage = async function (
  request: TestRequest,
  workspaceRoot: string,
): Promise<number> {
  const coverageRoot = join(workspaceRoot, "dist", "coverage");
  const raw = join(coverageRoot, "raw");
  rmSync(coverageRoot, { recursive: true, force: true });
  mkdirSync(raw, { recursive: true });
  let selected =
    request.paths.length > 0
      ? resolveTestTargets(workspaceRoot, request.paths, workspaceRoot)
      : resolveTestTargets(
          workspaceRoot,
          resolveTestProjects(workspaceRoot).filter(function (project) {
            return hasTestTarget(project, request.kind);
          }),
          workspaceRoot,
        );
  if (request.affected) {
    const nx = join(workspaceRoot, "node_modules", ".bin", "nx");
    const affected = new Deno.Command(nx, {
      args: [
        "show",
        "projects",
        "--affected",
        `--withTarget=${resolveTestTask(request.kind)}`,
        "--json",
      ],
      cwd: workspaceRoot,
      stdout: "piped",
      stderr: "inherit",
    }).outputSync();
    if (!affected.success) {
      return affected.code;
    }
    const names: string[] = JSON.parse(
      new TextDecoder().decode(affected.stdout),
    );
    selected = selected.filter(function (target) {
      return names.includes(target.name);
    });
  }
  for (const target of selected) {
    const profile = join(raw, target.name.replace(/^@[^/]+\//, ""));
    const extra = [`--coverage=${profile}`];
    const viaNx =
      target.files.length === 0 &&
      (request.kind === null || request.kind === TestKindEnum.TEST) &&
      request.flags.length === 0;
    const code = viaNx
      ? await runTestProjects({
          workspaceRoot,
          request: { ...request, affected: false },
          names: [target.name],
          extra,
          nxFlags: ["--skip-nx-cache"],
        })
      : await runTestTarget(target, request, workspaceRoot, extra);
    if (code !== 0) {
      return code;
    }
    if (
      existsSync(profile) &&
      readdirSync(profile).some(function (file) {
        return file.endsWith(".json");
      })
    ) {
      if (!existsSync(join(profile, "lcov.info"))) {
        throw new Error(`coverage report missing for ${target.name}`);
      }
      continue;
    }
    rmSync(profile, { recursive: true, force: true });
  }
  reportTestCoverage({ workspaceRoot, coverageRoot });
  return 0;
};

export default runTestCoverage;
