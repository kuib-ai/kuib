// @context @journal/domains/infra#^C015
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
