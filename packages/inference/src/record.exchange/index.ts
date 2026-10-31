// @claim core/provider-captures
import fixturePath from "@kuib-ai/inference/fixture.path";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, openSync, closeSync, rmSync } from "node:fs";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import type { CaptureResult } from "../capture.result/index.ts";
import type { LedgerEntry } from "../ledger.entry/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import allowance from "../check.allowance/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import bytesHash from "../hash.bytes/index.ts";
import safePath from "../resolve.capture.path/index.ts";
import write from "../write.capture.file/index.ts";
import readPrepared from "../read.prepared.request/index.ts";
import append from "../append.ledger/index.ts";
import reserved from "../reserve.request/index.ts";
import usageOf from "../read.response.usage/index.ts";
import costOf from "../cost.response/index.ts";
import stopOf from "../find.response.stop/index.ts";
import observeResponse from "../observe.response/index.ts";
import scanResponse from "../scan.response/index.ts";
import withError from "@kuib-ai/std/with.error";

const { ENCODER, scan, sensitiveValues } = ScanSensitiveBytesUnit;
const { fail } = RefuseCaptureUnit;

const recordExchange = async function (
  path: string,
  run: RecordInput,
  options: CaptureOptions,
): Promise<CaptureResult> {
  const input = readPrepared(path, run, options);
  const request = input.request;
  const folder = input.folder;
  const responsePath = safePath(
    options.root,
    fixturePath(
      request.messageFormat,
      request.provider,
      request.model,
      request.name,
    ),
    "response.json",
  );
  if (existsSync(responsePath)) fail("capture-exists");
  const ordinal = allowance(request, options);
  const at = options.time ?? new Date().toISOString();
  const base = {
    ordinal,
    provider: request.provider,
    fixture: fixturePath(
      request.messageFormat,
      request.provider,
      request.model,
      request.name,
    ),
    row: request.row,
    price: request.price,
    time: at,
    url: request.url,
    authHeader: input.prepared.authHeader!,
    ...(request.diagnosticRepeatOf === undefined
      ? {}
      : { diagnosticRepeatOf: request.diagnosticRepeatOf }),
    ...(request.signedRepeatOf === undefined
      ? {}
      : { signedRepeatOf: request.signedRepeatOf }),
    ...(request.ceilingRepeatOf === undefined
      ? {}
      : { ceilingRepeatOf: request.ceilingRepeatOf }),
    ...(request.admissionRepeatOf === undefined
      ? {}
      : { admissionRepeatOf: request.admissionRepeatOf }),
  };
  append(
    {
      ...base,
      kind: "started",
      costUsd: reserved(request),
      stop: null,
      url: request.url,
      bodyHash: bytesHash(ENCODER.encode(request.body)),
    },
    options,
    sensitiveValues(options),
  );
  const observed = await observeResponse(request, input.prepared, options);
  const {
    bytes,
    lengths,
    status,
    statusText,
    state,
    safety,
    responseHeaders,
    excludedHeaders,
    organizationId,
    values,
    kinds,
  } = observed;
  const usage = state === "complete" ? usageOf(bytes) : null;
  const stop = safety ?? stopOf(status, bytes);
  const costUsd =
    state === "complete" &&
    status !== null &&
    status >= 400 &&
    status < 500 &&
    usage === null
      ? 0
      : costOf(usage, request);
  const metadata = {
    status,
    statusText,
    headers: responseHeaders,
    excludedHeaders,
  };
  const finishedAt = options.time ?? new Date().toISOString();
  const transportBase = {
    lengths,
    bytes: bytes.length,
    sha256: bytesHash(bytes),
    boundary: "fetch-body-reader",
    state,
    cut: request.cut ?? null,
    startedAt: at,
    finishedAt,
  };
  const finished: LedgerEntry = {
    ...base,
    kind: "finished",
    time: finishedAt,
    costUsd,
    stop,
    status,
    state,
    usage,
  };
  const checked = scanResponse({
    bytes,
    requestBody: request.body,
    organizationId,
    metadata,
    transport: transportBase,
    finished,
    values,
    kinds,
  });
  if (checked.diagnosis !== null) {
    append(
      {
        ...base,
        kind: "finished",
        costUsd: reserved(request),
        stop: "sensitive-data",
        status,
        state,
        diagnosis: checked.diagnosis,
      },
      options,
      sensitiveValues(options),
    );
    return fail("sensitive-data");
  }
  const { transport, bodyValues } = checked;
  if (safety !== null) {
    append(finished, options, values);
    return fail(safety);
  }
  write(responsePath, metadata, values);
  write(join(folder, "response.body"), bytes, bodyValues);
  write(join(folder, "transport.json"), transport, values);
  append(finished, options, values);
  return {
    fixture: base.fixture,
    status,
    state,
    usage,
    costUsd,
    stop,
  };
};

const record = async function (
  path: string,
  run: RecordInput,
  options: CaptureOptions,
): Promise<CaptureResult> {
  const lock = `${options.ledger}.lock`;
  scan(ENCODER.encode(lock), sensitiveValues(options));
  mkdirSync(dirname(lock), { recursive: true });
  const [error, descriptor] = withError(function () {
    return openSync(lock, "wx");
  });
  if (error !== null) return fail("capture-running");
  using _lock = {
    [Symbol.dispose]() {
      closeSync(descriptor);
      rmSync(lock);
    },
  };
  return await recordExchange(path, run, options);
};

export default record;
