import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { join, relative } from "node:path";
import { TRPCError } from "@trpc/server";
import Trpc from "../../trpc/index.ts";
import readFileProcedure from "./index.ts";

const router = Trpc.router({ readFile: readFileProcedure });
const createCaller = Trpc.createCallerFactory(router);
const caller = createCaller({});

describe("read.file procedure", function () {
  it("reads an existing file with ~ expansion and returns its content", async function () {
    using dir = createTempDir(".kuib-read-file-test-", homedir());
    const filePath = join(dir.path, "hello.txt");
    writeFileSync(filePath, "hello world", "utf8");
    const tildePath = "~/" + relative(homedir(), filePath);

    const result = await caller.readFile({ path: tildePath });

    expect(result.content).toBe("hello world");
  });

  it("throws a TRPCError INTERNAL_SERVER_ERROR when the read fails", async function () {
    using dir = createTempDir();
    const missing = join(dir.path, "nope.txt");

    const promise = caller.readFile({ path: missing });

    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
