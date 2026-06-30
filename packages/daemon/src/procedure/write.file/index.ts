// @context @journal/architecture-overview
import { writeFile } from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import Std from "@kuib-ai/std";
import Trpc from "../../trpc";
import WriteFileInput from "../../io/write.file.input";
import WriteFileOutput from "../../io/write.file.output";

const writeFileProcedure = Trpc.procedure
  .input(WriteFileInput)
  .output(WriteFileOutput)
  .mutation(async ({ input }) => {
    const [error] = await Std.asyncWithError(
      writeFile(input.path, input.content),
    );
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
    return { success: true as const };
  });

export default writeFileProcedure;
