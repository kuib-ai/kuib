// @context @journal/host-layer
import { parseArgs } from "node:util";
import Std from "@kuib-ai/std";
import printHelp from "../print.help";
import type { CliSchema } from "../cli.schema";

export type ParseCliResult<T> = {
  values: T;
  positionals: string[];
};

const parseCli = function <T extends Record<string, unknown>>(
  command: string,
  schema: CliSchema,
  argv: string[] = process.argv.slice(2),
): ParseCliResult<T> | null {
  const options = schema.options as NonNullable<
    Parameters<typeof parseArgs>[0]
  >["options"];

  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp(command, schema);
    return null;
  }

  const [err, parsed] = Std.withError(function () {
    return parseArgs({
      args: argv,
      options,
      allowPositionals: true,
    });
  });

  if (err !== null) {
    process.stderr.write(`Error parsing arguments: ${err.message}\n`);
    process.stderr.write(`Run with --help for usage.\n`);
    return null;
  }

  return {
    values: parsed.values as T,
    positionals: parsed.positionals,
  };
};

export default parseCli;
