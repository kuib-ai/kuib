// @claim core/provider-captures
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";

export type CaptureOptions = {
  root: string;
  ledger: string;
  key: string;
  secrets?: string[];
  origins?: string[];
  limits?: Partial<Record<ProviderEnum, number>>;
  budgetUsd?: number;
  time?: string;
  timeoutMs?: number;
};
