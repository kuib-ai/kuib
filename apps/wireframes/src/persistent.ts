import { createSignal, type Signal } from "solid-js";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function createPersistentSignal<T>(
  filePath: string,
  initialValue: T,
): Signal<T> {
  let initial = initialValue;
  try {
    const raw = readFileSync(filePath, "utf-8");
    initial = JSON.parse(raw);
  } catch (e) {
    // File doesn't exist or is invalid, fallback to initialValue
  }

  const [state, setState] = createSignal<T>(initial);

  const setPersistentState = (next: any) => {
    const nextValue = typeof next === "function" ? next(state()) : next;
    setState(nextValue);
    try {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, JSON.stringify(nextValue));
    } catch (e) {
      // Ignore write errors
    }
    return nextValue;
  };

  return [state, setPersistentState as any];
}
