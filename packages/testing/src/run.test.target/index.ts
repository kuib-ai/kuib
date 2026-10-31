// @claim infra/test-runner
import { TestKindEnum } from "../test.kind.enum/index.ts";
import { join } from "node:path";
import acquireTestSlot from "../acquire.test.slot/index.ts";
import createSandbox from "../create.sandbox/index.ts";
import resolveTestEnv from "../resolve.test.env/index.ts";
import resolveTestFiles from "../resolve.test.files/index.ts";
import resolveTestKind from "../resolve.test.kind/index.ts";
import resolveTestPermissions from "../resolve.test.permissions/index.ts";
import runTestProcess from "../run.test.process/index.ts";
import type { TestRequest } from "../parse.test.request/index.ts";
import type { TestTarget } from "../resolve.test.targets/index.ts";

const SLOT_LIMIT = 4;
const SLOT_INTERVAL_MS = 200;

const denoDir = function (): string {
  const inherited = process.env["DENO_DIR"];
  if (inherited !== undefined && inherited.length > 0) {
    return inherited;
  }
  const info = new Deno.Command(Deno.execPath(), {
    args: ["info", "--json"],
    stdout: "piped",
    stderr: "null",
  }).outputSync();
  return JSON.parse(new TextDecoder().decode(info.stdout)).denoDir;
};

const slotDir = function (depth: number, workspaceRoot: string): string {
  if (depth === 0) {
    return join(workspaceRoot, "node_modules", ".cache", "kuib-test-slots");
  }
  const slots = process.env["KUIB_TEST_SLOTS"];
  if (slots === undefined) {
    throw new Error(
      "KUIB_TEST_SLOTS is not set for a nested run; the runner sets it.",
    );
  }
  return slots;
};

// @claim infra/test-runner
const runTestTarget = async function (
  target: TestTarget,
  request: TestRequest,
  workspaceRoot: string,
  extra: string[] = [],
): Promise<number> {
  const kind = resolveTestKind(request.kind, target.files);
  using held = new DisposableStack();
  held.use(
    await acquireTestSlot({
      dir: slotDir(request.depth, workspaceRoot),
      limit: SLOT_LIMIT,
      intervalMs: SLOT_INTERVAL_MS,
      onWait: function () {
        console.error(
          `waiting for a test slot: ${SLOT_LIMIT} test processes are running`,
        );
      },
    }),
  );
  const sandbox = held.use(createSandbox());
  const args = [
    kind === TestKindEnum.BENCH ? "bench" : "test",
    "--no-check",
    "--permit-no-files",
    ...resolveTestPermissions({
      kind,
      project: target.name,
      sandbox,
      workspaceRoot,
    }),
    ...request.flags,
    ...extra,
    ...resolveTestFiles(kind, target, workspaceRoot),
  ];
  const env = resolveTestEnv({
    kind,
    sandbox,
    env: process.env,
    denoDir: denoDir(),
    depth: request.depth + 1,
  });
  const coverage = [...request.flags, ...extra].find(function (flag) {
    return flag.startsWith("--coverage=");
  });
  if (coverage !== undefined) {
    env["KUIB_TEST_COVERAGE"] = coverage.slice("--coverage=".length);
  }
  return await runTestProcess(Deno.execPath(), args, {
    cwd: target.project,
    env,
  });
};

export default runTestTarget;
