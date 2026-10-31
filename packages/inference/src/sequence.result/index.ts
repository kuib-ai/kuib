// @claim core/provider-captures
import type { CaptureResult } from "../capture.result/index.ts";

export type SequenceResult = {
  results: CaptureResult[];
  stop: CaptureResult["stop"];
};
