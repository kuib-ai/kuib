// @context @journal/domains/core#^C037
import { readFile } from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import Std from "@kuib-ai/std";
import Protocol from "@kuib-ai/protocol";
import Trpc from "../../trpc/index.ts";
import expandHomePath from "../../expand.home.path/index.ts";

const readFileProcedure = Trpc.procedure
  .input(Protocol.FileSystem.ReadFileInput)
  .output(Protocol.FileSystem.ReadFileOutput)
  .query(async function ({ input }) {
    const [error, content] = await Std.withError(
      readFile(expandHomePath(input.path), "utf8"),
    );
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
    return { content };
  });

export default readFileProcedure;
