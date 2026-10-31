import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { basename, dirname } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import acquireTestSlot from "./index.ts";

const pause = function (ms: number): Promise<void> {
  return new Promise<void>(function (resolve) {
    setTimeout(resolve, ms);
  });
};

describe("acquireTestSlot", function () {
  it("hands out one slot per call, each on its own file of the folder", async function () {
    using dir = createTempDir("slots-");
    const input = { dir: dir.path, limit: 3, intervalMs: 5 };

    using one = await acquireTestSlot(input);
    using two = await acquireTestSlot(input);
    using three = await acquireTestSlot(input);

    expect([one.path, two.path, three.path].map(dirname)).toEqual([
      dir.path,
      dir.path,
      dir.path,
    ]);
    const names = [one.path, two.path, three.path].map(function (path) {
      return basename(path);
    });
    expect(names).toEqual(["0", "1", "2"]);
  });

  it("waits while every slot is held and takes the one that is freed", async function () {
    using dir = createTempDir("slots-");
    let waits = 0;
    const input = {
      dir: dir.path,
      limit: 2,
      intervalMs: 5,
      onWait: function (): void {
        waits += 1;
      },
    };
    using _one = await acquireTestSlot(input);
    const two = await acquireTestSlot(input);
    let taken = false;

    const third = acquireTestSlot(input).then(function (slot) {
      taken = true;
      return slot;
    });
    await pause(60);

    expect(taken).toBe(false);
    expect(waits).toBe(1);

    two[Symbol.dispose]();
    using three = await third;

    expect(three.path).toBe(two.path);
    expect(waits).toBe(1);
  });

  it("never holds more slots than the limit, however many ask at once", async function () {
    using dir = createTempDir("slots-");
    const input = { dir: dir.path, limit: 2, intervalMs: 2 };
    let held = 0;
    let most = 0;

    await Promise.all(
      Array.from({ length: 8 }, async function () {
        using _slot = await acquireTestSlot(input);
        held += 1;
        most = Math.max(most, held);
        await pause(10);
        held -= 1;
      }),
    );

    expect(most).toBe(2);
  });

  it("frees the slot when the holder's scope ends by throwing", async function () {
    using dir = createTempDir("slots-");
    const input = { dir: dir.path, limit: 1, intervalMs: 5 };
    const scope = async function (): Promise<void> {
      using _slot = await acquireTestSlot(input);
      throw new Error("the run failed");
    };

    await expect(scope()).rejects.toThrow("the run failed");
    using again = await acquireTestSlot(input);

    expect(basename(again.path)).toBe("0");
  });

  it("creates the folder when it is missing", async function () {
    using dir = createTempDir("slots-");
    const nested = `${dir.path}/a/b`;

    using slot = await acquireTestSlot({
      dir: nested,
      limit: 1,
      intervalMs: 5,
    });

    expect(dirname(slot.path)).toBe(nested);
  });
});
