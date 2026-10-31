import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join, dirname } from "node:path";
import { writeFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import audit from "./index.ts";
import createCaptureOptions from "../create.capture.options/index.ts";
import createCaptureRequest from "../create.capture.request/index.ts";
import prepare from "../prepare.request/index.ts";
import withError from "@kuib-ai/std/with.error";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";

it("refuses an identifying header in a recorded envelope", function () {
  using dir = createTempDir("capture-audit-");
  writeFileSync(
    join(dir.path, "request.json"),
    JSON.stringify({ headers: { "x-api-key": "redacted" } }),
  );
  expect(function () {
    audit(dir.path, []);
  }).toThrow("identity-header-on-disk");
});

it("refuses mixed provenance and detects sensitive data and identity headers during an audit", function () {
  using dir = createTempDir("capture-audit-provenance-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  const input = createCaptureRequest(origin);
  const path = prepare(input, options);
  const folder = dirname(path);
  writeFileSync(
    join(folder, "fixture.json"),
    JSON.stringify({ shows: input.shows, origin: "written" }),
  );
  expect(function () {
    prepare(input, options);
  }).toThrow("fixture-description-conflict");
  writeFileSync(join(folder, "echo.bin"), options.key);
  expect(function () {
    audit(options.root, [options.key]);
  }).toThrow("sensitive-data");
  writeFileSync(join(folder, "echo.bin"), "safe");
  writeFileSync(
    join(folder, "response.json"),
    JSON.stringify({ headers: { "x-account-id": "private" } }),
  );
  expect(function () {
    audit(options.root, [options.key]);
  }).toThrow("identity-header-on-disk");
});

for (const alphabet of ["base64", "base64url"] as const) {
  for (const alignment of [0, 1, 2]) {
    it(`finds a hidden UUID in ${alphabet} at byte alignment ${alignment} without a secret`, function () {
      using dir = createTempDir("capture-uuid-");
      const value = "12345678-1234-4567-89ab-123456789abc";
      const encoded = Buffer.concat([
        Buffer.from([251, 255, 255, 251, 255, 255]),
        Buffer.alloc(alignment, 171),
        Buffer.from(value),
        Buffer.from("suffix"),
      ]).toString(alphabet);
      const origin = "http://127.0.0.1:3210";
      const options = createCaptureOptions(dir.path, origin);
      const { path } = prepareCaptureTestCase(origin, options);
      writeFileSync(
        join(dirname(path), "response.body"),
        JSON.stringify({ signature: encoded }),
      );
      const [error] = withError(
        function () {
          audit(options.root, []);
        },
        function (cause) {
          return cause;
        },
      );
      expect(error).toHaveProperty("code", "encoded-uuid");
      expect(error).toHaveProperty(
        "fixture",
        "anthropic-messages/anthropic/claude-sonnet-5-5/plain",
      );
      expect(String(error)).not.toContain(value);
      expect(JSON.stringify(error)).not.toContain(encoded);
    });
  }
}
