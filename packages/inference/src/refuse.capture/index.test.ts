import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import RefuseCapture from "./index.ts";

it("preserves a refusal code without exposing a secret", function () {
  expect(function () {
    RefuseCapture.fail("unsafe-header");
  }).toThrow("unsafe-header");
  const error = new RefuseCapture.CaptureError("unsafe-header");
  expect(error.code).toBe("unsafe-header");
  expect(error.message).toBe("unsafe-header");
});
