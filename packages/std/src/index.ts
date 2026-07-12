// @context @journal/house-style-linting
import withError from "./with.error";
import mapError from "./map.error";
import isErr from "./is.err";
import createNoopLogger from "./create.noop.logger";
import createConsoleLogger from "./create.console.logger";
import build from "./build";
import errorFields from "./error.fields";
import { LogLevelEnum } from "./log.level.enum";
import LogScope from "./log.scope";

const Std = {
  withError,
  mapError,
  isErr,
  createNoopLogger,
  createConsoleLogger,
  build,
  errorFields,
  LogLevelEnum,
  withScope: LogScope.withScope,
  currentScope: LogScope.currentScope,
  bindLogger: LogScope.bindLogger,
};

export default Std;
