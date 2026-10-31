// @claim core/provider-captures
import { resolve, join } from "node:path";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";

const { FIXTURES, ROOT } = ResolveCaptureRootUnit;

const HOSTS = [
  "api.anthropic.com:443",
  "token-plan-sgp.xiaomimimo.com:443",
  "api.xiaomimimo.com:443",
  "api.meta.ai:443",
];

const resolveCapturePermissions = function (runFolder?: string): string[] {
  const read = [
    join(ROOT, "packages", "inference", "src"),
    join(ROOT, "packages", "inference", "package.json"),
    join(ROOT, "packages", "protocol", "src"),
    join(ROOT, "packages", "protocol", "package.json"),
    join(ROOT, "packages", "std", "src"),
    join(ROOT, "packages", "std", "package.json"),
    join(ROOT, "node_modules"),
    join(ROOT, "package.json"),
    join(ROOT, "pnpm-workspace.yaml"),
    FIXTURES,
    join(ROOT, ".env"),
    ...(runFolder === undefined ? [] : [resolve(runFolder)]),
  ];
  const write = [
    FIXTURES,
    ...(runFolder === undefined ? [] : [resolve(runFolder)]),
  ];
  return [
    "--no-prompt",
    `--allow-read=${read.join(",")}`,
    `--allow-write=${write.join(",")}`,
    "--allow-env=KUIB_ANTHROPIC_API_KEY,KUIB_MIMO_API_KEY,KUIB_META_API_KEY",
    `--allow-net=${HOSTS.join(",")}`,
  ];
};

export default resolveCapturePermissions;
