// @context @journal/host-layer
import { dirname, join } from "node:path";

import Cli from "@kuib-ai/cli";
import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";

import env from "./env";
import log from "./log";
import run from "./run";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const cliSchema: CliSchema = {
  description: "Kuib AI Terminal Interface",
  options: {},
};

const main = async function (): Promise<void> {
  const parsed = Cli.parseCli("kuib", cliSchema);

  log.info({
    message: "parsed",
    parsed,
  });

  if (parsed === null) {
    return;
  }

  const dbPath = env.KUIB_DB_PATH;
  const socketPath = join(dirname(dbPath), "engine.sock");
  const sessionID = Protocol.ID.SessionID.parse(env.KUIB_SESSION_ID);
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());
  const localLabel = env.KUIB_NODE_LABEL;
  const deviceLabel = env.KUIB_TARGET_NODE ?? localLabel;
  const command = parsed.positionals[0] ?? "ui";

  switch (command) {
    case "serve":
      return run.serve(dbPath, socketPath, deviceID, localLabel);
    case "ui":
      return run.ui(dbPath, socketPath, sessionID, deviceLabel);
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.exit(1);
  }
};

const [error] = await Std.withError(main);
if (error !== null) {
  log.error(Std.errorFields(error), "kuib failed to start");
  process.stderr.write(`kuib failed to start: ${error.message}\n`);
  process.exit(1);
}
