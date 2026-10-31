// @claim infra/test-runner
import { TestKindEnum } from "../test.kind.enum/index.ts";

const LIVE_FILE = /\.live\.test\.tsx?$/;
const BENCH_FILE = /\.bench\.tsx?$/;

// @claim infra/test-runner
const resolveTestKind = function (
  requested: TestKindEnum | null,
  files: string[],
): TestKindEnum {
  if (requested !== null) {
    return requested;
  }
  if (files.length > 0 && files.every(LIVE_FILE.test.bind(LIVE_FILE))) {
    return TestKindEnum.LIVE;
  }
  if (files.length > 0 && files.every(BENCH_FILE.test.bind(BENCH_FILE))) {
    return TestKindEnum.BENCH;
  }
  return TestKindEnum.TEST;
};

export default resolveTestKind;
