// @context @journal/host-layer
import type { CliSchema } from "../cli.schema";

const printHelp = function (command: string, schema: CliSchema): void {
  const invocation = command.length === 0 ? "kuib" : `kuib ${command}`;
  process.stdout.write(`\nUsage: ${invocation} [options]\n`);
  process.stdout.write(`${schema.description}\n\nOptions:\n`);

  for (const [flag, details] of Object.entries(schema.options)) {
    const short = details.short ? `-${details.short}, ` : "    ";
    const typeStr = details.type === "string" ? `<string>` : `        `;
    const defaultStr =
      details.default !== undefined ? `(default: ${details.default})` : "";
    const description = details.description ?? "";

    process.stdout.write(
      `  ${short}--${flag} ${typeStr}\t${description} ${defaultStr}\n`,
    );
  }
  process.stdout.write(`\n`);
};

export default printHelp;
