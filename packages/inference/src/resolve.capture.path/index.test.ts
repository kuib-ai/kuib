import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import safePath from "./index.ts";

it("keeps capture paths under the fixture root", function () {
  using dir = createTempDir("capture-path-");
  expect(safePath(dir.path, "case", "request.json")).toBe(
    join(dir.path, "case", "request.json"),
  );
  expect(function () {
    safePath(dir.path, "..");
  }).toThrow("unsafe-path");
});
