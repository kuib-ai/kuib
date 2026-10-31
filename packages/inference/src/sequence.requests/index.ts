// @claim core/provider-captures
import { readFileSync } from "node:fs";
import type { PreparedRequest } from "../prepared.request/index.ts";
import type { CaptureResult } from "../capture.result/index.ts";
import type { SequenceOptions } from "../sequence.options/index.ts";
import type { SequenceResult } from "../sequence.result/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import record from "../record.exchange/index.ts";

const { validateProvider } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;
const { parseJson } = ParseCaptureJsonUnit;

const sequence = async function (
  entries: { path: string; run: RecordInput }[],
  options: SequenceOptions,
): Promise<SequenceResult> {
  const results: CaptureResult[] = [];
  let consecutiveFailures = 0;
  for (const { path, run } of entries) {
    const prepared = parseJson(readFileSync(path, "utf8")) as PreparedRequest;
    const provider = validateProvider(prepared.provider);
    const key = options.keys[provider] ?? fail("missing-key");
    const result = await record(path, run, {
      ...options,
      key,
      secrets: [...(options.secrets ?? []), ...Object.values(options.keys)],
    });
    results.push(result);
    if (result.stop !== null) return { results, stop: result.stop };
    const transient =
      result.state === "fetch-failed" ||
      result.status === 429 ||
      (result.status !== null && result.status >= 500 && result.status <= 599);
    consecutiveFailures = transient ? consecutiveFailures + 1 : 0;
    if (consecutiveFailures >= 2)
      return { results, stop: "consecutive-transient-failures" };
  }
  return { results, stop: null };
};

export default sequence;
