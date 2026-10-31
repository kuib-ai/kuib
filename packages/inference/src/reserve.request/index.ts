// @claim core/provider-captures
import type { RecordRequest } from "../record.request/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";

const { ENCODER } = ScanSensitiveBytesUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const reserved = function (request: RecordRequest): number {
  const body = object(parseJson(request.body))!;
  const limit = Math.max(
    0,
    Number(body.max_completion_tokens ?? -1),
    Number(body.max_tokens ?? -1),
  );
  const input = Math.max(
    request.price.inputTokens,
    ENCODER.encode(request.body).length,
  );
  const inputPrice = request.body.includes('"cache_control"')
    ? Math.max(
        request.price.input,
        request.price.cacheWrite5m ?? request.price.input * 1.25,
        request.price.cacheWrite1h ?? request.price.input * 2,
      )
    : request.price.input;
  return (input * inputPrice + limit * request.price.output) / 1_000_000;
};

export default reserved;
