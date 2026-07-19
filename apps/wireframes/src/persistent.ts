// @context @journal/ux-iteration-process
import { createSignal, type Signal, type Setter } from "solid-js";
import Std from "@kuib-ai/std";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const createPersistentSignal = function <T>(
  filePath: string,
  initialValue: T,
): Signal<T> {
  let initial = initialValue;
  const [readErr, raw] = Std.withError(function () {
    return readFileSync(filePath, "utf-8");
  });
  if (!readErr) {
    const [parseErr, parsed] = Std.withError(function () {
      return JSON.parse(raw) as T;
    });
    if (!parseErr) {
      initial = parsed;
    }
  }

  const [state, setState] = createSignal<T>(initial);

  const setPersistentState = function (next: T | ((prev: T) => T)): T {
    const nextValue =
      typeof next === "function" ? (next as (prev: T) => T)(state()) : next;
    setState(function () {
      return nextValue;
    });
    Std.withError(function () {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, JSON.stringify(nextValue));
    });
    return nextValue;
  };

  return [state, setPersistentState as Setter<T>];
};

export default createPersistentSignal;
