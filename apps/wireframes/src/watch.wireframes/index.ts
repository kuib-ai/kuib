// @context @journal/ux-iteration-process
import { watch } from "node:fs";
import { join } from "node:path";
import loadWireframes from "../load.wireframes";
import type { Wireframe } from "../load.wireframes";

type WatchHandle = {
  close: () => void;
};

const signatureOf = function (wireframes: Wireframe[]): string {
  return wireframes
    .map(
      (wireframe) =>
        `${wireframe.path}:${wireframe.modifiedAt}:${wireframe.content.length}`,
    )
    .join("|");
};

const watchWireframes = function (
  workspaceRoot: string,
  onChange: (wireframes: Wireframe[]) => void,
): WatchHandle {
  const journalDir = join(workspaceRoot, "journal");
  let lastSignature = signatureOf(loadWireframes(workspaceRoot));
  let timer: ReturnType<typeof setTimeout> | null = null;

  const check = function (): void {
    const next = loadWireframes(workspaceRoot);
    const signature = signatureOf(next);
    if (signature === lastSignature) {
      return;
    }
    lastSignature = signature;
    onChange(next);
  };

  const scheduleCheck = function (): void {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(check, 50);
  };

  const watcher = watch(journalDir, { recursive: true }, scheduleCheck);
  const poll = setInterval(check, 2000);

  return {
    close: () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      clearInterval(poll);
      watcher.close();
    },
  };
};

export default watchWireframes;
export type { WatchHandle };
