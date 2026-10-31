import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import listCaptureFiles from "./index.ts";

it("visits nested synthetic fixture files", function () {
  using dir = createTempDir("capture-files-");
  mkdirSync(join(dir.path, "case"));
  writeFileSync(join(dir.path, "case", "request.json"), "{}");
  expect(listCaptureFiles(dir.path)).toEqual([
    join(dir.path, "case", "request.json"),
  ]);
});
