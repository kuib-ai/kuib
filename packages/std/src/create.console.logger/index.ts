// @context @journal/observability
import type { Logger, LogBindings, LogFn } from "../logger.port";
import LogScope from "../log.scope";

type ConsoleSink = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

type CreateConsoleLoggerOptions = {
  name?: string;
  sink?: ConsoleSink;
};

const write = function (
  sinkFn: (...args: unknown[]) => void,
  bindings: LogBindings,
  msgOrObj: string | LogBindings,
  maybeMsg?: string,
): void {
  if (typeof msgOrObj === "string") {
    sinkFn(msgOrObj, bindings);
    return;
  }
  sinkFn(maybeMsg ?? "", { ...bindings, ...msgOrObj });
};

const createWithBindings = function (
  sink: ConsoleSink,
  bindings: LogBindings,
): Logger {
  const makeFn = function (sinkFn: (...args: unknown[]) => void): LogFn {
    return LogScope.wrapLogFn(function (
      msgOrObj: string | LogBindings,
      maybeMsg?: string,
    ) {
      write(sinkFn, bindings, msgOrObj, maybeMsg);
    } as LogFn);
  };

  return {
    debug: makeFn(sink.debug.bind(sink)),
    info: makeFn(sink.info.bind(sink)),
    warn: makeFn(sink.warn.bind(sink)),
    error: makeFn(sink.error.bind(sink)),
    child: function (childBindings: LogBindings): Logger {
      return createWithBindings(sink, { ...bindings, ...childBindings });
    },
  };
};

const createConsoleLogger = function (
  options: CreateConsoleLoggerOptions = {},
): Logger {
  const sink = options.sink ?? console;
  const bindings: LogBindings =
    options.name === undefined ? {} : { name: options.name };
  return createWithBindings(sink, bindings);
};

export default createConsoleLogger;
export type { CreateConsoleLoggerOptions };
