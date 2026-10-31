// @claim core/provider-captures
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import withError from "@kuib-ai/std/with.error";

const { fail } = RefuseCaptureUnit;

const object = function (value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const parseJson = function (text: string): unknown {
  const [error, value] = withError(function () {
    return JSON.parse(text);
  });
  if (error !== null) return fail("invalid-json");
  return value;
};

export default { object, parseJson };
