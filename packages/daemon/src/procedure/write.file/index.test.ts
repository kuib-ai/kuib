import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFile } from "node:fs/promises";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { join } from "node:path";
import { TRPCError } from "@trpc/server";
import Trpc from "../../trpc/index.ts";
import writeFileProcedure from "./index.ts";

const router = Trpc.router({ writeFile: writeFileProcedure });
const createCaller = Trpc.createCallerFactory(router);
const caller = createCaller({});

describe("writeFile procedure", function () {
  it("writes the content and returns success", async function () {
    using dir = createTempDir();
    const path = join(dir.path, "file.txt");
    const result = await caller.writeFile({ path, content: "hello" });
    expect(result.success).toBe(true);
    const written = await readFile(path, "utf8");
    expect(written).toBe("hello");
  });

  it("throws INTERNAL_SERVER_ERROR when the write fails", async function () {
    using dir = createTempDir();
    const path = join(dir.path, "missing", "nested", "file.txt");
    const promise = caller.writeFile({ path, content: "data" });
    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
