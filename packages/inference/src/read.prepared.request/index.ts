// @claim core/provider-captures
import fixturePath from "@kuib-ai/inference/fixture.path";
import { join, relative, resolve } from "node:path";
import { readFileSync } from "node:fs";
import type { PreparedRequest } from "../prepared.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import type { RecordRequest } from "../record.request/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import safePath from "../resolve.capture.path/index.ts";

const { validate } = ValidateRequestUnit;
const { CaptureError, fail } = RefuseCaptureUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const readPrepared = function (
  path: string,
  run: RecordInput,
  options: CaptureOptions,
): { request: RecordRequest; prepared: PreparedRequest; folder: string } {
  const local = relative(resolve(options.root), resolve(path));
  safePath(options.root, local);
  if (
    object(run) === null ||
    Object.keys(run).some(function (key) {
      return ![
        "row",
        "price",
        "cut",
        "diagnosticRepeatOf",
        "signedRepeatOf",
        "ceilingRepeatOf",
        "admissionRepeatOf",
      ].includes(key);
    })
  )
    fail("invalid-run-input");
  const prepared = parseJson(readFileSync(path, "utf8")) as PreparedRequest;
  if (
    prepared.method !== "POST" ||
    typeof prepared.authHeader !== "string" ||
    prepared.headers?.["content-type"] !== "application/json" ||
    prepared.headers?.["accept-encoding"] !== "identity" ||
    Object.keys(prepared).some(function (key) {
      return ![
        "messageFormat",
        "provider",
        "model",
        "name",
        "method",
        "url",
        "authHeader",
        "headers",
        "replay",
      ].includes(key);
    })
  )
    fail("invalid-prepared-request");
  const folder = safePath(
    options.root,
    fixturePath(
      prepared.messageFormat,
      prepared.provider,
      prepared.model,
      prepared.name,
    ),
  );
  if (resolve(path) !== join(folder, "request.json")) fail("unsafe-path");
  const description = object(
    parseJson(readFileSync(join(folder, "fixture.json"), "utf8")),
  );
  if (
    description?.origin !== "recorded" ||
    typeof description.shows !== "string" ||
    Object.keys(description).length !== 2
  )
    throw new CaptureError("invalid-description");
  const bodyPath = safePath(
    options.root,
    fixturePath(
      prepared.messageFormat,
      prepared.provider,
      prepared.model,
      prepared.name,
    ),
    "request.body",
  );
  const request: RecordRequest = {
    ...prepared,
    shows: description.shows,
    body: readFileSync(bodyPath, "utf8"),
    ...run,
  };
  validate(request, options, true);
  return { request, prepared, folder };
};

export default readPrepared;
