// @context @journal/observability
import pino from "pino";
import Protocol from "@kuib-ai/protocol";
import type { Logger, LogBindings } from "../logger.port";
import { LogLevelEnum } from "../log.level.enum";
import LogScope from "../log.scope";

type CreatePinoLoggerOptions = {
  name: string;
  level?: LogLevelEnum;
  destination?: string;
  pretty?: boolean;
};

const serializeErr = function (value: unknown): unknown {
  const parsed = Protocol.Error.AnyError.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  if (value instanceof Error) {
    return pino.stdSerializers.err(value);
  }
  return value;
};

const wrap = function (instance: pino.Logger): Logger {
  return {
    debug: LogScope.wrapLogFn(instance.debug.bind(instance) as Logger["debug"]),
    info: LogScope.wrapLogFn(instance.info.bind(instance) as Logger["info"]),
    warn: LogScope.wrapLogFn(instance.warn.bind(instance) as Logger["warn"]),
    error: LogScope.wrapLogFn(instance.error.bind(instance) as Logger["error"]),
    child: function (bindings: LogBindings): Logger {
      return wrap(instance.child(bindings));
    },
  };
};

const createPinoLogger = function (options: CreatePinoLoggerOptions): Logger {
  const level = options.level ?? LogLevelEnum.INFO;
  const base = {
    name: options.name,
    level,
    serializers: {
      err: serializeErr,
    },
  };

  if (options.destination !== undefined) {
    return wrap(
      pino(base, pino.destination({ dest: options.destination, sync: true })),
    );
  }

  if (options.pretty === true) {
    return wrap(
      pino({
        ...base,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
    );
  }

  return wrap(pino(base));
};

export default createPinoLogger;
export type { CreatePinoLoggerOptions };
