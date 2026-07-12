// @context @journal/observability
type LogBindings = Record<string, unknown>;

type LogFn = {
  (msg: string): void;
  (obj: LogBindings, msg?: string): void;
};

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: LogBindings) => Logger;
}

export type { Logger, LogBindings, LogFn };
