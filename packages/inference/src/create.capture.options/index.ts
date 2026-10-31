// @claim core/provider-captures
import { join } from "node:path";
import type { CaptureOptions } from "../capture.options/index.ts";

const createCaptureOptions = function (
  root: string,
  origin: string,
): CaptureOptions {
  return {
    root: join(root, "fixtures"),
    ledger: join(root, "ledger.jsonl"),
    key: "synthetic-secret-key-93",
    origins: [origin],
    time: "2026-10-14T00:00:00.000Z",
    timeoutMs: 5000,
  };
};

export default createCaptureOptions;
