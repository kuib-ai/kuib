import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import formatCaptureError from "./index.ts";

it("keeps refusal codes while hiding arbitrary error text", function () {
  const { CaptureError } = RefuseCaptureUnit;
  expect(formatCaptureError(new CaptureError("unsafe-header"))).toContain(
    "(unsafe-header)",
  );
  expect(formatCaptureError(new Error("synthetic-secret-key-93"))).toContain(
    "(capture-error)",
  );
  expect(
    formatCaptureError(new Error("synthetic-secret-key-93")),
  ).not.toContain("synthetic-secret-key-93");
  expect(formatCaptureError(new Error("spawn failed"), true)).toContain(
    "(permission-denied)",
  );
});
