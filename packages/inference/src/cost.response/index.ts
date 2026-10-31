// @claim core/provider-captures
import type { RecordRequest } from "../record.request/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import reserved from "../reserve.request/index.ts";

const { object } = ParseCaptureJsonUnit;

const number = function (value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
};

const costOf = function (
  usage: Record<string, unknown> | null,
  request: RecordRequest,
): number {
  if (usage === null) return reserved(request);
  const output = number(usage.output_tokens ?? usage.completion_tokens);
  const input = number(usage.input_tokens ?? usage.prompt_tokens);
  if (output === null || input === null) return reserved(request);
  const read =
    number(
      usage.cache_read_input_tokens ??
        object(usage.prompt_tokens_details)?.cached_tokens,
    ) ?? 0;
  const writeCount = number(usage.cache_creation_input_tokens) ?? 0;
  const hour =
    number(object(usage.cache_creation)?.ephemeral_1h_input_tokens) ?? 0;
  const fresh =
    usage.input_tokens === undefined ? Math.max(0, input - read) : input;
  return (
    (fresh * request.price.input +
      output * request.price.output +
      read * (request.price.cacheRead ?? request.price.input) +
      Math.max(0, writeCount - hour) *
        (request.price.cacheWrite5m ?? request.price.input * 1.25) +
      hour * (request.price.cacheWrite1h ?? request.price.input * 2)) /
    1_000_000
  );
};

export default costOf;
