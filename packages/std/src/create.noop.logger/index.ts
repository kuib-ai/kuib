// @context @journal/domains/infra#^C019
import type { Logger, LogBindings, LogFn } from "../logger.port/index.ts";

const noop: LogFn = function () {};

const createNoopLogger = function (): Logger {
  const logger: Logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: function (_bindings: LogBindings): Logger {
      return logger;
    },
  };
  return logger;
};

export default createNoopLogger;
