// @claim core/provider-captures
import type { ScanMatch } from "../scan.match/index.ts";

class CaptureError extends Error {
  readonly code: string;
  readonly match?: ScanMatch;
  readonly fixture?: string;
  constructor(code: string, match?: ScanMatch, fixture?: string) {
    super(code);
    this.code = code;
    this.match = match;
    this.fixture = fixture;
  }
}

const fail: (code: string) => never = function (code) {
  throw new CaptureError(code);
};

export default { CaptureError, fail };
