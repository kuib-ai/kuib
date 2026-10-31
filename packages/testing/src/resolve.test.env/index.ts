// @claim infra/test-permissions
import { delimiter } from "node:path";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import type { Sandbox } from "../create.sandbox/index.ts";

const KEPT = ["PATH", "NO_COLOR", "FORCE_COLOR", "TERM", "CI"];
const DROPPED = ["KUIB_TEST_NESTED"];

type TestEnvInput = {
  kind: TestKindEnum;
  sandbox: Pick<Sandbox, "home" | "temp" | "slots" | "sockets">;
  env: Record<string, string | undefined>;
  denoDir: string;
  depth: number;
};

// @claim infra/test-permissions
const resolveTestEnv = function (input: TestEnvInput): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.env)) {
    if (value === undefined || DROPPED.includes(key)) {
      continue;
    }
    if (input.kind === TestKindEnum.LIVE || KEPT.includes(key)) {
      resolved[key] = value;
    }
  }
  resolved["HOME"] = input.sandbox.home;
  resolved["TMPDIR"] = input.sandbox.temp;
  resolved["DENO_DIR"] = input.denoDir;
  resolved["KUIB_TEST_SOCKETS"] = input.sandbox.sockets.join(delimiter);
  resolved["KUIB_TEST_SLOTS"] = input.sandbox.slots;
  resolved["KUIB_TEST_DEPTH"] = String(input.depth);
  return resolved;
};

export default resolveTestEnv;
export type { TestEnvInput };
