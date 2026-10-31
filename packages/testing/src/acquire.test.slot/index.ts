// @claim infra/test-bounds
import { mkdirSync } from "node:fs";
import { join } from "node:path";

type TestSlot = Disposable & { path: string };

type TestSlotInput = {
  dir: string;
  limit: number;
  intervalMs: number;
  onWait?: () => void;
};

const claim = function (path: string): TestSlot | null {
  const file = Deno.openSync(path, { create: true, write: true });
  if (!file.tryLockSync(true)) {
    file.close();
    return null;
  }
  return {
    path,
    [Symbol.dispose]: function () {
      file.close();
    },
  };
};

const pause = function (ms: number): Promise<void> {
  return new Promise<void>(function (resolve) {
    setTimeout(resolve, ms);
  });
};

// @claim infra/test-bounds
const acquireTestSlot = async function (
  input: TestSlotInput,
): Promise<TestSlot> {
  mkdirSync(input.dir, { recursive: true });
  let waited = false;
  while (true) {
    for (let index = 0; index < input.limit; index += 1) {
      const slot = claim(join(input.dir, String(index)));
      if (slot !== null) {
        return slot;
      }
    }
    if (!waited) {
      waited = true;
      input.onWait?.();
    }
    await pause(input.intervalMs);
  }
};

export default acquireTestSlot;
export type { TestSlot, TestSlotInput };
