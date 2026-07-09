// @context @journal/tool-system
import { readFile } from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import Std from "@kuib-ai/std";
import Protocol from "@kuib-ai/protocol";
import Trpc from "../../trpc";
import expandHomePath from "../../expand.home.path";

const readFileProcedure = Trpc.procedure
  .input(Protocol.FileSystem.ReadFileInput)
  .output(Protocol.FileSystem.ReadFileOutput)
  .query(async ({ input }) => {
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
