import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createCaptureRequest from "../create.capture.request/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import reserved from "./index.ts";

it("reserves the full requested output before usage exists", function () {
  const request = {
    ...createCaptureRequest("http://127.0.0.1:3210"),
    ...createRecordInput(),
  };
  const expected =
    (Math.max(
      request.price.inputTokens,
      new TextEncoder().encode(request.body).length,
    ) *
      request.price.input +
      32 * request.price.output) /
    1_000_000;
  expect(reserved(request)).toBe(expected);
});
