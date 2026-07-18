// @context @journal/tool-system
import { readdir } from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import Std from "@kuib-ai/std";
import Protocol from "@kuib-ai/protocol";
import Trpc from "../../trpc";
import expandHomePath from "../../expand.home.path";

const readDirProcedure = Trpc.procedure
  .input(Protocol.FileSystem.ReadDirInput)
  .output(Protocol.FileSystem.ReadDirOutput)
  .query(async ({ input }) => {
    const [error, content] = await Std.withError(
      readdir(expandHomePath(input.path), "utf8"),
    );
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
    return { content: content.join("\n") };
  });

export default readDirProcedure;
