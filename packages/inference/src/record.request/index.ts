// @claim core/provider-captures
import type { CaptureRequest } from "../capture.request/index.ts";
import type { RecordInput } from "../record.input/index.ts";

export type RecordRequest = CaptureRequest & RecordInput;
