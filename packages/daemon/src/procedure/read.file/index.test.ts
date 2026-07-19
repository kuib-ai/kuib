import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, relative } from "node:path";
import { TRPCError } from "@trpc/server";
import Trpc from "../../trpc";
import readFileProcedure from "./index";

const router = Trpc.router({ readFile: readFileProcedure });
const createCaller = Trpc.createCallerFactory(router);
const caller = createCaller({});

describe("read.file procedure", function () {
  it("reads an existing file with ~ expansion and returns its content", async function () {
    const dir = mkdtempSync(join(homedir(), ".kuib-read-file-test-"));
    const filePath = join(dir, "hello.txt");
    writeFileSync(filePath, "hello world", "utf8");
    const tildePath = "~/" + relative(homedir(), filePath);

    const result = await caller.readFile({ path: tildePath });

    expect(result.content).toBe("hello world");
  });

  it("throws a TRPCError INTERNAL_SERVER_ERROR when the read fails", async function () {
    const missing = join(mkdtempSync(join(tmpdir(), "kuib-rf-")), "nope.txt");

    const promise = caller.readFile({ path: missing });

    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
