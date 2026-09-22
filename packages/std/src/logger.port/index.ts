// @claim infra/logger-port
type LogBindings = Record<string, unknown>;

type LogFn = {
  (msg: string): void;
  (obj: LogBindings, msg?: string): void;
};

// @claim infra/logger-port
interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: LogBindings) => Logger;
}

export type { Logger, LogBindings, LogFn };
