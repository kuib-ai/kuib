// @claim core/provider-captures
import RefuseCaptureUnit from "../refuse.capture/index.ts";

const { CaptureError } = RefuseCaptureUnit;

const formatCaptureError = function (error: unknown, launcher = false): string {
  const code =
    error instanceof CaptureError
      ? error.code
      : launcher || error instanceof Deno.errors.NotCapable
        ? "permission-denied"
        : "capture-error";
  const fixture =
    error instanceof CaptureError && error.fixture !== undefined
      ? `: ${error.fixture}`
      : "";
  return `capture refused (${code})${fixture}; see the sanitized ledger when a call was started`;
};

export default formatCaptureError;
