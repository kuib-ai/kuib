import { describe, it, expect } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TRPCError } from "@trpc/server";
import Trpc from "../../trpc";
import writeFileProcedure from "./index";

const router = Trpc.router({ writeFile: writeFileProcedure });
const createCaller = Trpc.createCallerFactory(router);
const caller = createCaller({});

describe("writeFile procedure", () => {
  it("writes the content and returns success", async () => {
    const path = join(tmpdir(), `kuib-write-file-${Date.now()}.txt`);
    const result = await caller.writeFile({ path, content: "hello" });
    expect(result.success).toBe(true);
    const written = await readFile(path, "utf8");
    expect(written).toBe("hello");
    await rm(path);
  });

  it("throws INTERNAL_SERVER_ERROR when the write fails", async () => {
    const path = join(tmpdir(), "kuib-missing-dir", "nested", "file.txt");
    const promise = caller.writeFile({ path, content: "data" });
    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
