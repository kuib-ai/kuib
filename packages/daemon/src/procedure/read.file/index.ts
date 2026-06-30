// @context @journal/architecture-overview
import { readFile } from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import Std from "@kuib-ai/std";
import Trpc from "../../trpc";
import ReadFileInput from "../../io/read.file.input";
import ReadFileOutput from "../../io/read.file.output";

const readFileProcedure = Trpc.procedure
  .input(ReadFileInput)
  .output(ReadFileOutput)
  .query(async ({ input }) => {
    const [error, content] = await Std.asyncWithError(
      readFile(input.path, "utf8"),
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
