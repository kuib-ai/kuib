import type { CliSchema } from "@kuib-ai/cli/cli.schema";

// @context @journal/host-layer
const schema: CliSchema = {
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

export default schema;
