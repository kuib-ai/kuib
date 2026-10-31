// @claim infra/testing-helpers
import { mkdirSync, rmSync } from "node:fs";
import { delimiter } from "node:path";

type SocketPath = Disposable & { path: string };

const claim = function (path: string): boolean {
  // eslint-disable-next-line no-restricted-syntax
  try {
    mkdirSync(`${path}.claim`);
    return true;
  } catch {
    return false;
  }
};

// @claim infra/testing-helpers
const createSocketPath = function (): SocketPath {
  const pool = (process.env["KUIB_TEST_SOCKETS"] ?? "")
    .split(delimiter)
    .filter(Boolean);
  if (pool.length === 0) {
    throw new Error(
      "KUIB_TEST_SOCKETS is not set: run tests through `pnpm test`, which grants the socket paths.",
    );
  }
  const path = pool.find(claim);
  if (path === undefined) {
    throw new Error(
      `all ${pool.length} test socket paths are in use; dispose one before taking another.`,
    );
  }
  return {
    path,
    [Symbol.dispose]: function () {
      rmSync(path, { recursive: true, force: true });
      rmSync(`${path}.claim`, { recursive: true, force: true });
    },
  };
};

export default createSocketPath;
export type { SocketPath };
