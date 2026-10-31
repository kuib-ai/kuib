// @claim core/provider-captures
import withError from "@kuib-ai/std/with.error";
import type { RecordRequest } from "../record.request/index.ts";
import type { PreparedRequest } from "../prepared.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { CaptureResult } from "../capture.result/index.ts";
import type { ScanDiagnosis } from "../scan.diagnosis/index.ts";
import type { ObservedResponse } from "../observed.response/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import cutAt from "../find.response.cut/index.ts";
import frames from "../parse.response.frames/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";

const { ENCODER, sensitiveValues } = ScanSensitiveBytesUnit;
const { IDENTITY_HEADER, RATE_HEADER, RESPONSE_HEADERS, MAX_BYTES } =
  ValidateRequestUnit;

const observeResponse = async function (
  request: RecordRequest,
  prepared: PreparedRequest,
  options: CaptureOptions,
): Promise<ObservedResponse> {
  const headers = new Headers(prepared.headers);
  const auth = prepared.authHeader!;
  headers.set(
    auth,
    auth === "authorization" ? `Bearer ${options.key}` : options.key,
  );
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, options.timeoutMs ?? 120_000);
  const chunks: Uint8Array[] = [];
  const lengths: number[] = [];
  const values = sensitiveValues(options);
  const kinds: Pick<ScanDiagnosis, "kind" | "header">[] = values.map(
    function (value) {
      return {
        kind: value === options.key ? "call-key" : "other-provider-key",
      };
    },
  );
  let size = 0;
  let response: Response | undefined;
  let state: CaptureResult["state"] = "complete";
  let safety: string | null = null;
  const responseHeaders: Record<string, string> = {};
  const excludedHeaders = { identity: 0, unknown: 0 };
  let organizationId: string | undefined;
  const [networkError] = await withError(async function () {
    response = await fetch(request.url, {
      method: "POST",
      headers,
      body: ENCODER.encode(request.body),
      redirect: "manual",
      signal: controller.signal,
    });
    for (const [name, value] of response.headers) {
      if (IDENTITY_HEADER.test(name) && !RATE_HEADER.test(name)) {
        if (name === "anthropic-organization-id") organizationId = value;
        values.push(value);
        kinds.push({ kind: "response-header", header: name });
        excludedHeaders.identity++;
      }
      if (RESPONSE_HEADERS.has(name) || RATE_HEADER.test(name)) {
        responseHeaders[name] = value;
        continue;
      }
      if (!IDENTITY_HEADER.test(name)) excludedHeaders.unknown++;
    }
    if (response.status >= 300 && response.status < 400)
      safety = "redirect-refused";
    const skipBody =
      (request.cut === "headers" && response.ok) || safety !== null;
    if (skipBody) {
      state = "cancelled";
      await response.body?.cancel();
      controller.abort();
    }
    if (!skipBody && response.body !== null) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let observed = "";
      using _reader = {
        [Symbol.dispose]() {
          reader.releaseLock();
        },
      };
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > MAX_BYTES) {
          safety = "response-too-large";
          await reader.cancel();
          break;
        }
        chunks.push(next.value);
        lengths.push(next.value.length);
        if (request.cut !== undefined) {
          observed += decoder.decode(next.value, { stream: true });
          if (cutAt(observed, request.cut, request.provider)) {
            state = "cancelled";
            await reader.cancel();
            controller.abort();
            break;
          }
        }
      }
    }
  });
  if (networkError !== null)
    state = response === undefined ? "fetch-failed" : "read-failed";
  clearTimeout(timer);
  const bytes = new Uint8Array(
    chunks.reduce(function (sum, chunk) {
      return sum + chunk.length;
    }, 0),
  );
  let position = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, position);
    position += chunk.length;
  }
  const status = response?.status ?? null;
  if (
    state === "complete" &&
    status === 200 &&
    responseHeaders["content-type"]?.includes("text/event-stream")
  ) {
    const text = new TextDecoder().decode(bytes);
    const terminal =
      /(^|\n)data:\s*\[DONE\]\s*(\r?\n|$)/.test(text) ||
      frames(text).some(function (frame) {
        return frame.type === "message_stop";
      });
    if (!terminal) state = "incomplete";
  }
  return {
    bytes,
    lengths,
    status,
    statusText: response?.statusText ?? null,
    state,
    safety,
    responseHeaders,
    excludedHeaders,
    organizationId,
    values,
    kinds,
  };
};

export default observeResponse;
