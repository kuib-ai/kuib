// @claim core/provider-captures
import type { ScanMatch } from "../scan.match/index.ts";

export type ScanDiagnosis = Omit<ScanMatch, "index"> & {
  kind: "call-key" | "other-provider-key" | "response-header";
  header?: string;
  blob:
    | "response-body"
    | "response-metadata"
    | "transport-metadata"
    | "ledger-entry";
};
