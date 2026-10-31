// @claim core/provider-captures
import resolveCapturePermissions from "../resolve.capture.permissions/index.ts";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";
import formatCaptureError from "../format.capture.error/index.ts";
import withError from "@kuib-ai/std/with.error";
import { join } from "node:path";

const { ROOT } = ResolveCaptureRootUnit;

const execute = async function (args: string[]): Promise<void> {
  const command = args[0];
  if (command === undefined || command === "--help" || command === "-h") {
    console.log(
      "Usage: inference prepare|record|sequence|lift|reprice <run-folder> | audit | refile | rename <messageFormat|provider|model> <old> <new>",
    );
    return;
  }
  const runFolder = [
    "prepare",
    "record",
    "sequence",
    "lift",
    "reprice",
  ].includes(command)
    ? args[1]
    : undefined;
  if (
    ["prepare", "record", "sequence", "lift", "reprice"].includes(command) &&
    runFolder === undefined
  ) {
    console.error("capture refused (invalid-run-folder)");
    Deno.exitCode = 1;
    return;
  }
  const child = new Deno.Command(join(ROOT, "node_modules", ".bin", "deno"), {
    args: [
      "run",
      "--no-check",
      ...resolveCapturePermissions(runFolder),
      new URL("../run.capture.operation/index.ts", import.meta.url).href,
      ...args,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const result = await child.spawn().status;
  Deno.exitCode = result.code;
};

const main = async function (args: string[]): Promise<void> {
  const [error] = await withError(
    function () {
      return execute(args);
    },
    function (cause) {
      return cause;
    },
  );
  if (error === null) return;
  console.error(formatCaptureError(error, true));
  Deno.exitCode = 1;
};

export default main;
