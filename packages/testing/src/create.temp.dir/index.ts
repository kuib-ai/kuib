// @claim infra/testing-helpers
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type TempDir = Disposable & { path: string };

// @claim infra/testing-helpers
const createTempDir = function (
  prefix: string = "kuib-",
  parent: string = tmpdir(),
): TempDir {
  const path = realpathSync(mkdtempSync(join(parent, prefix)));
  return {
    path,
    [Symbol.dispose]: function () {
      rmSync(path, { recursive: true, force: true });
    },
  };
};

export default createTempDir;
export type { TempDir };
