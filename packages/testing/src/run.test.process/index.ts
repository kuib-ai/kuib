// @claim infra/test-runner
type TestProcessOptions = { cwd: string; env?: Record<string, string> };

// @claim infra/test-runner
const runTestProcess = async function (
  command: string,
  args: string[],
  options: TestProcessOptions,
): Promise<number> {
  const child = new Deno.Command(command, {
    args,
    cwd: options.cwd,
    env: options.env,
    clearEnv: options.env !== undefined,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  let running = true;
  const interrupt = function (): void {
    if (running) {
      child.kill("SIGINT");
    }
  };
  const terminate = function (): void {
    if (running) {
      child.kill("SIGTERM");
    }
  };
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", terminate);
  const status = await child.status.finally(function () {
    running = false;
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", terminate);
  });
  return status.code;
};

export default runTestProcess;
