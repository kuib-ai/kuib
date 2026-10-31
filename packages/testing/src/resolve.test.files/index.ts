// @claim infra/test-runner
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { TestKindEnum } from "../test.kind.enum/index.ts";
import type { TestTarget } from "../resolve.test.targets/index.ts";

const FILES: Record<TestKindEnum, string[]> = {
  [TestKindEnum.TEST]: ["**/*.test.ts", "**/*.test.tsx"],
  [TestKindEnum.LIVE]: ["**/*.live.test.ts", "**/*.live.test.tsx"],
  [TestKindEnum.BENCH]: ["**/*.bench.ts", "**/*.bench.tsx"],
};

// @claim infra/test-runner
const resolveTestFiles = function (
  kind: TestKindEnum,
  target: TestTarget,
  workspaceRoot: string,
): string[] {
  const chosen =
    target.files.length === 0
      ? FILES[kind]
      : target.files.flatMap(function (file) {
          return statSync(join(target.project, file)).isDirectory()
            ? FILES[kind].map(function (pattern) {
                return join(file, pattern);
              })
            : [file];
        });
  switch (kind) {
    case TestKindEnum.TEST:
      return [`--ignore=${FILES[TestKindEnum.LIVE].join(",")}`, ...chosen];
    case TestKindEnum.LIVE: {
      const envFile = join(workspaceRoot, ".env");
      return [
        ...(existsSync(envFile) ? [`--env-file=${envFile}`] : []),
        ...chosen,
      ];
    }
    case TestKindEnum.BENCH:
      return chosen;
  }
};

export default resolveTestFiles;
