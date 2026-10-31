// @claim core/provider-captures
import { dirname, relative, resolve } from "node:path";
import { existsSync, lstatSync } from "node:fs";
import RefuseCaptureUnit from "../refuse.capture/index.ts";

const { fail } = RefuseCaptureUnit;

const safePath = function (root: string, ...parts: string[]): string {
  const base = resolve(root);
  const path = resolve(base, ...parts);
  const local = relative(base, path);
  if (local.startsWith("..") || local.startsWith("/") || local === "")
    fail("unsafe-path");
  let ancestor = path;
  while (true) {
    if (existsSync(ancestor) && lstatSync(ancestor).isSymbolicLink())
      fail("unsafe-path");
    if (ancestor === base) break;
    const parent = dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  return path;
};

export default safePath;
