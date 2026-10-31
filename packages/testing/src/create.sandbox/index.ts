// @claim infra/test-permissions
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOCKET_COUNT = 16;

type Sandbox = Disposable & {
  root: string;
  home: string;
  temp: string;
  slots: string;
  sockets: string[];
};

// @claim infra/test-permissions
const createSandbox = function (parent: string = tmpdir()): Sandbox {
  const root = realpathSync(mkdtempSync(join(parent, "kuib-test-")));
  const home = join(root, "home");
  const temp = join(root, "tmp");
  const slots = join(root, "slots");
  const socketDir = join(root, "s");
  mkdirSync(home);
  mkdirSync(temp);
  mkdirSync(slots);
  mkdirSync(socketDir);
  const sockets = Array.from({ length: SOCKET_COUNT }, function (_, index) {
    return join(socketDir, String(index));
  });
  return {
    root,
    home,
    temp,
    slots,
    sockets,
    [Symbol.dispose]: function () {
      rmSync(root, { recursive: true, force: true });
    },
  };
};

export default createSandbox;
export type { Sandbox };
