// @context @journal/house-style-linting
import withError from "./with.error/index.ts";
import mapError from "./map.error/index.ts";
import isErr from "./is.err/index.ts";
import createNoopLogger from "./create.noop.logger/index.ts";
import createConsoleLogger from "./create.console.logger/index.ts";
import errorFields from "./error.fields/index.ts";
import { LogLevelEnum } from "./log.level.enum/index.ts";
import LogScope from "./log.scope/index.ts";

const Std = {
  withError,
  mapError,
  isErr,
  createNoopLogger,
  createConsoleLogger,
  errorFields,
  LogLevelEnum,
  withScope: LogScope.withScope,
  currentScope: LogScope.currentScope,
  bindLogger: LogScope.bindLogger,
};

export default Std;
