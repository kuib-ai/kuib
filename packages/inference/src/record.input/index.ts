// @claim core/provider-captures
import type { Price } from "../price/index.ts";

export type RecordInput = {
  row: string;
  price: Price;
  cut?: "text" | "thinking" | "headers";
  diagnosticRepeatOf?: number;
  signedRepeatOf?: string;
  ceilingRepeatOf?: string;
  admissionRepeatOf?: string;
};
