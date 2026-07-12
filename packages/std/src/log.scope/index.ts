// @context @journal/observability
import { AsyncLocalStorage } from "node:async_hooks";
import type { Logger, LogBindings, LogFn } from "../logger.port";

type ScopeStore = {
  stack: LogBindings[];
};

const storage = new AsyncLocalStorage<ScopeStore>();

const isThenable = function (value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { then?: unknown }).then === "function"
  );
};

const currentScope = function (): LogBindings {
  const store = storage.getStore();
  if (store === undefined || store.stack.length === 0) {
    return {};
  }
  return Object.assign({}, ...store.stack) as LogBindings;
};

const withScope = function <T>(bindings: LogBindings, fn: () => T): T {
  const parent = storage.getStore();

  if (parent === undefined) {
    return storage.run({ stack: [bindings] }, fn);
  }

  parent.stack.push(bindings);
  // eslint-disable-next-line no-restricted-syntax -- scope lifetime needs push/pop
  try {
    const result = fn();
    if (isThenable(result)) {
      return result.then(
        (value) => {
          parent.stack.pop();
          return value;
        },
        (error: unknown) => {
          parent.stack.pop();
          throw error;
        },
      ) as T;
    }
    parent.stack.pop();
    return result;
  } catch (error: unknown) {
    parent.stack.pop();
    throw error;
  }
};

const bindLogger = function (log: Logger): Logger {
  return log.child(currentScope());
};

const wrapLogFn = function (emit: LogFn): LogFn {
  return function (msgOrObj: string | LogBindings, maybeMsg?: string) {
    const scope = currentScope();
    const empty = Object.keys(scope).length === 0;
    if (typeof msgOrObj === "string") {
      if (empty) {
        emit(msgOrObj);
        return;
      }
      emit(scope, msgOrObj);
      return;
    }
    if (empty) {
      emit(msgOrObj, maybeMsg);
      return;
    }
    emit({ ...scope, ...msgOrObj }, maybeMsg);
  } as LogFn;
};

const LogScope = {
  withScope,
  currentScope,
  bindLogger,
  wrapLogFn,
};

export default LogScope;
