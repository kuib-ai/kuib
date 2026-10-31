// @claim core/provider-captures
import type { CaptureResult } from "../capture.result/index.ts";
import type { ScanDiagnosis } from "../scan.diagnosis/index.ts";

export type ObservedResponse = {
  bytes: Uint8Array;
  lengths: number[];
  status: number | null;
  statusText: string | null;
  state: CaptureResult["state"];
  safety: string | null;
  responseHeaders: Record<string, string>;
  excludedHeaders: { identity: number; unknown: number };
  organizationId: string | undefined;
  values: string[];
  kinds: Pick<ScanDiagnosis, "kind" | "header">[];
};
