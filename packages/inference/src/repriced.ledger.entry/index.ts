// @claim core/provider-captures

export type RepricedLedgerEntry = {
  kind: "repriced";
  ordinal: number;
  time: string;
  reviewer: string;
  reason: string;
  costUsd: number;
};
