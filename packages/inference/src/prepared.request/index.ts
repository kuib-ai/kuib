// @claim core/provider-captures
import type { CaptureRequest } from "../capture.request/index.ts";

export type PreparedRequest = Omit<CaptureRequest, "body" | "shows"> & {
  method: "POST";
  headers: Record<string, string>;
};
