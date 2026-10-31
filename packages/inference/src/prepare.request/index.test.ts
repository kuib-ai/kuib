import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureRequest from "../create.capture.request/index.ts";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepare from "./index.ts";

it("prepares an exchange-only envelope and no sequence", function () {
  using dir = createTempDir("capture-prepare-");
  const origin = "http://127.0.0.1:3210";
  const path = prepare(
    createCaptureRequest(origin),
    createCaptureOptions(dir.path, origin),
  );
  const request = JSON.parse(readFileSync(path, "utf8"));
  expect(Object.keys(request).sort()).toEqual(
    [
      "messageFormat",
      "provider",
      "model",
      "name",
      "url",
      "authHeader",
      "method",
      "headers",
    ].sort(),
  );
  expect(existsSync(join(path, "..", "request.body"))).toBe(true);
  expect(existsSync(join(path, "..", "sequence.json"))).toBe(false);
});
