// @claim core/provider-captures
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { CaptureResult } from "../capture.result/index.ts";
import type { ScanDiagnosis } from "../scan.diagnosis/index.ts";
import type { Price } from "../price/index.ts";

export type LedgerEntry = {
  kind: "started" | "finished";
  ordinal: number;
  provider: ProviderEnum;
  fixture: string;
  row: string;
  price?: Price;
  time: string;
  costUsd: number;
  stop: string | null;
  status?: number | null;
  state?: CaptureResult["state"];
  usage?: Record<string, unknown> | null;
  url?: string;
  authHeader?: string;
  bodyHash?: string;
  diagnosis?: ScanDiagnosis;
  diagnosticRepeatOf?: number;
  signedRepeatOf?: string;
  ceilingRepeatOf?: string;
  admissionRepeatOf?: string;
};
