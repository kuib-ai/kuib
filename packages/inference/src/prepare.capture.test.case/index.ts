// @claim core/provider-captures
import type { CaptureRequest } from "../capture.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import prepare from "../prepare.request/index.ts";
import createCaptureRequest from "../create.capture.request/index.ts";
import createRecordInput from "../create.record.input/index.ts";

const prepareCaptureTestCase = function (
  origin: string,
  options: CaptureOptions,
  requestChanges: Partial<CaptureRequest> = {},
  runChanges: Partial<RecordInput> = {},
): { path: string; run: RecordInput } {
  return {
    path: prepare(createCaptureRequest(origin, requestChanges), options),
    run: createRecordInput(runChanges),
  };
};

export default prepareCaptureTestCase;
