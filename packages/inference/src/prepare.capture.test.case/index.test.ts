import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "./index.ts";

it("keeps run input beside an exchange-only prepared request", function () {
  using dir = createTempDir("capture-test-case-");
  const origin = "http://127.0.0.1:3210";
  const result = prepareCaptureTestCase(
    origin,
    createCaptureOptions(dir.path, origin),
  );
  const envelope = JSON.parse(readFileSync(result.path, "utf8"));
  expect(result.run.row).toBe("synthetic/plain");
  expect(envelope.row).toBeUndefined();
});
