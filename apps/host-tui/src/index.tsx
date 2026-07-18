// @context @journal/host-layer @journal/application-directories
import Cli from "@kuib-ai/cli";
import Config from "@kuib-ai/config";
import Protocol from "@kuib-ai/protocol";
import Std from "@kuib-ai/std";
import createLog from "./log";
import run from "./run";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const cliSchema: CliSchema = {
  description: "Kuib AI Terminal Interface",
  options: {
    config: { type: "string", description: "Alternate config.toml path" },
    "mesh-config": {
      type: "string",
      description: "Alternate mesh.config.toml path",
    },
    session: { type: "string", description: "Session ID" },
    "target-node": { type: "string", description: "Target mesh node" },
    model: { type: "string", description: "Model selector" },
    "log-level": { type: "string", description: "Logging level" },
    "db-path": { type: "string", description: "Alternate SQLite path" },
    "log-path": { type: "string", description: "Alternate log path" },
    "daemon-socket": {
      type: "string",
      description: "Alternate daemon socket",
    },
    "engine-socket": {
      type: "string",
      description: "Alternate engine socket",
    },
  },
};

type TuiCliValues = {
  config?: string;
  "mesh-config"?: string;
  session?: string;
  "target-node"?: string;
  model?: string;
  "log-level"?: string;
  "db-path"?: string;
  "log-path"?: string;
  "daemon-socket"?: string;
  "engine-socket"?: string;
};

let log: ReturnType<typeof createLog> | undefined;

const main = async function (): Promise<void> {
  const parsed = Cli.parseCli<TuiCliValues>("", cliSchema);
  if (parsed === null) {
    return;
  }

  const values = parsed.values;
  const bootstrap = Config.bootstrapConfig({
    cli: {
      configFile: values.config,
      meshConfigFile: values["mesh-config"],
      database: values["db-path"],
      log: values["log-path"],
      daemonSocket: values["daemon-socket"],
      engineSocket: values["engine-socket"],
      sessionID: values.session,
      targetNode: values["target-node"],
      model: values.model,
      logLevel: values["log-level"],
    },
  });
  Config.ensureAppPaths(bootstrap.paths);
  log = createLog(bootstrap);
  log.info({
    message: "parsed",
    parsed,
    configFile: bootstrap.paths.configFile,
  });

  log.info(
    Std.build(Protocol.Error.ErrorLlmFailed, {
      message: "Failed to load LLM",
    }),
  );

  const sessionID = Protocol.ID.SessionID.parse(bootstrap.runtime.sessionID);
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());
  const command = parsed.positionals[0] ?? "ui";

  switch (command) {
    case "serve": {
      return run.serve(bootstrap, deviceID, log);
    }
    case "ui": {
      const forwarded = Object.entries(values).flatMap(([key, value]) =>
        value === undefined ? [] : [`--${key}`, value],
      );
      return run.ui(
        bootstrap.paths.database,
        bootstrap.paths.engineSocket,
        sessionID,
        bootstrap.config.target.node,
        [process.argv[1] ?? "", "serve", ...forwarded],
        log,
      );
    }
    default: {
      process.stderr.write(`Unknown command: ${command}\n`);
      process.exit(1);
    }
  }
};

const [error] = await Std.withError(main);
if (error !== null) {
  log?.error(Std.errorFields(error), "kuib failed to start");
  process.stderr.write(`kuib failed to start: ${error.message}\n`);
  process.exit(1);
}
