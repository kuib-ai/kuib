// @claim core/provider-captures
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { CaptureOptions } from "../capture.options/index.ts";

export type SequenceOptions = Omit<CaptureOptions, "key"> & {
  keys: Partial<Record<ProviderEnum, string>>;
};
