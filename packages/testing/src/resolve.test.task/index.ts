// @claim infra/test-runner
import { TestKindEnum } from "../test.kind.enum/index.ts";

// @claim infra/test-runner
const resolveTestTask = function (kind: TestKindEnum | null): string {
  if (kind === TestKindEnum.LIVE) {
    return "test:live";
  }
  if (kind === TestKindEnum.BENCH) {
    return "bench";
  }
  return "test";
};

export default resolveTestTask;
