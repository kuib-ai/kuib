// @claim core/provider-captures

export type LiftedLedgerEntry = {
  kind: "lifted";
  ordinal: number;
  time: string;
  reviewer: string;
  reason: string;
};
