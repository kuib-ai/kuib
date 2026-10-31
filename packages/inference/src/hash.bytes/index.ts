// @claim core/provider-captures
import { createHash } from "node:crypto";

const bytesHash = function (bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
};

export default bytesHash;
