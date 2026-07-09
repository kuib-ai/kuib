// @context @journal/host-layer
import parseCli from "./parse.cli";
import printHelp from "./print.help";
import type { CliSchema, CliOption } from "./cli.schema";

const Cli = { parseCli, printHelp };

export default Cli;
export type { CliSchema, CliOption };
