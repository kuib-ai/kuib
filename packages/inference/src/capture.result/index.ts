// @claim core/provider-captures

export type CaptureResult = {
  fixture: string;
  status: number | null;
  state:
    "complete" | "incomplete" | "cancelled" | "read-failed" | "fetch-failed";
  usage: Record<string, unknown> | null;
  costUsd: number;
  stop: string | null;
};
