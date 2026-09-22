// @claim infra/bootstrap-config
// @claim infra/bootstrap-config
type ConfigOverrides = {
  configFile?: string;
  meshConfigFile?: string;
  database?: string;
  log?: string;
  daemonSocket?: string;
  engineSocket?: string;
  sessionID?: string;
  targetNode?: string;
  model?: string;
  logLevel?: string;
  webPort?: string | number;
};

export type { ConfigOverrides };
