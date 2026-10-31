// @claim core/provider-captures
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PreparedRequest } from "../prepared.request/index.ts";

const createFixtureCase = function (
  root: string,
  folder: string,
  request: PreparedRequest,
  body = new Uint8Array([0, 255, 10]),
): string {
  const path = join(root, folder);
  mkdirSync(path, { recursive: true });
  writeFileSync(
    join(path, "fixture.json"),
    JSON.stringify({ shows: "A synthetic case", origin: "recorded" }),
  );
  writeFileSync(join(path, "request.json"), JSON.stringify(request));
  writeFileSync(join(path, "request.body"), body);
  return path;
};

export default createFixtureCase;
