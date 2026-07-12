// @context @journal/architecture-overview
import { exec } from "node:child_process";
import { promisify } from "node:util";
import Std from "@kuib-ai/std";
import Trpc from "../../trpc";
import ExecuteCommandInput from "../../io/execute.command.input";
import ExecuteCommandOutput from "../../io/execute.command.output";

const execAsync = promisify(exec);

const executeCommand = Trpc.procedure
  .input(ExecuteCommandInput)
  .output(ExecuteCommandOutput)
  .mutation(async ({ input }) => {
    const [error, result] = await Std.withError(
      execAsync(input.command, {
        cwd: input.cwd ?? process.cwd(),
        env: { ...process.env, ...input.env },
      }),
    );
    if (error) {
      return {
        stdout: String(error.details?.stdout ?? ""),
        stderr: String(error.details?.stderr ?? error.message),
        exitCode: Number(error.details?.code ?? 1),
      };
    }
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  });

export default executeCommand;
