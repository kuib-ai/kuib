// @claim infra/test-runner
import { TestKindEnum } from "../test.kind.enum/index.ts";

type TestRequest = {
  paths: string[];
  flags: string[];
  kind: TestKindEnum | null;
  affected: boolean;
  coverage: boolean;
  depth: number;
};

const parseKind = function (flag: string | undefined): TestKindEnum | null {
  if (flag === undefined) {
    return null;
  }
  const value = flag.slice("--kind=".length);
  const kind = Object.values(TestKindEnum).find(function (candidate) {
    return candidate === value;
  });
  if (kind === undefined) {
    throw new Error(`unknown --kind=${value}; use test, live or bench`);
  }
  return kind;
};

// @claim infra/test-runner
const parseTestRequest = function (argv: string[], depth: number): TestRequest {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const firstFlag = args.findIndex(function (arg) {
    return arg.startsWith("-");
  });
  const paths = firstFlag === -1 ? args : args.slice(0, firstFlag);
  const rest = firstFlag === -1 ? [] : args.slice(firstFlag);
  const isKind = function (arg: string): boolean {
    return arg.startsWith("--kind=");
  };
  return {
    paths,
    depth,
    kind: parseKind(rest.find(isKind)),
    affected: rest.includes("--affected"),
    coverage: rest.includes("--coverage"),
    flags: rest.filter(function (arg) {
      return arg !== "--affected" && arg !== "--coverage" && !isKind(arg);
    }),
  };
};

export default parseTestRequest;
export type { TestRequest };
