// @claim infra/test-permissions
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import type { Sandbox } from "../create.sandbox/index.ts";

type ProjectGrant = {
  all?: boolean;
  run?: true | string[];
  bind?: boolean;
};

// @claim infra/test-permissions
const PROJECT_GRANTS: Record<string, ProjectGrant> = {
  "@kuib-ai/daemon": { run: true, bind: true },
  "@kuib-ai/testing": { run: true },
  "@kuib-ai/inference": { run: [Deno.execPath()] },
  "@kuib-ai/tooling": { run: [Deno.execPath(), "git", "tmux"] },
  "@kuib-ai/engine": { all: true },
  "@kuib-ai/engine-service": { all: true },
};

const LOOPBACK = ["127.0.0.1", "localhost", "[::1]"];
const EVERY_INTERFACE = ["[::]", "0.0.0.0"];
const ENV_FILE = /^\.env(\..+)?$/;
const ENV_EXAMPLE = ".env.example";

type TestPermissionsInput = {
  kind: TestKindEnum;
  project: string;
  sandbox: Pick<Sandbox, "root" | "sockets">;
  workspaceRoot: string;
};

const envFiles = function (workspaceRoot: string): string[] {
  const present = readdirSync(workspaceRoot).filter(function (name) {
    return ENV_FILE.test(name) && name !== ENV_EXAMPLE;
  });
  return [...new Set([".env", ...present])].map(function (name) {
    return join(workspaceRoot, name);
  });
};

// @claim infra/test-permissions
const resolveTestPermissions = function (
  input: TestPermissionsInput,
): string[] {
  const grant = PROJECT_GRANTS[input.project] ?? {};
  const live = input.kind === TestKindEnum.LIVE;
  const denied = live
    ? []
    : [`--deny-read=${envFiles(input.workspaceRoot).join(",")}`];
  if (grant.all === true) {
    return ["--no-prompt", "--allow-all", ...denied];
  }
  const hosts = [
    ...LOOPBACK,
    ...(grant.bind === true ? EVERY_INTERFACE : []),
    ...input.sandbox.sockets.map(function (path) {
      return `unix:${path}`;
    }),
  ];
  return [
    "--no-prompt",
    "--allow-read",
    ...denied,
    "--allow-env",
    "--allow-sys",
    `--allow-write=${input.sandbox.root}`,
    live ? "--allow-net" : `--allow-net=${hosts.join(",")}`,
    ...(grant.run === true
      ? ["--allow-run"]
      : grant.run === undefined
        ? []
        : [`--allow-run=${grant.run.join(",")}`]),
  ];
};

export default resolveTestPermissions;
export type { TestPermissionsInput };
