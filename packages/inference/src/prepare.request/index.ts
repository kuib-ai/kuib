// @claim core/provider-captures
import fixturePath from "@kuib-ai/inference/fixture.path";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { CaptureRequest } from "../capture.request/index.ts";
import type { PreparedRequest } from "../prepared.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import safePath from "../resolve.capture.path/index.ts";
import write from "../write.capture.file/index.ts";

const { ENCODER, scan, sensitiveValues } = ScanSensitiveBytesUnit;
const { AUTH, validate } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;
const { parseJson } = ParseCaptureJsonUnit;

const prepare = function (
  request: CaptureRequest,
  options: CaptureOptions,
): string {
  validate(request, options);
  const folderName = fixturePath(
    request.messageFormat,
    request.provider,
    request.model,
    request.name,
  );
  const folder = safePath(options.root, folderName);
  const path = safePath(options.root, folderName, "request.json");
  const bodyPath = safePath(options.root, folderName, "request.body");
  const descriptionPath = join(folder, "fixture.json");
  const description = { shows: request.shows, origin: "recorded" };
  if (
    existsSync(descriptionPath) &&
    JSON.stringify(parseJson(readFileSync(descriptionPath, "utf8"))) !==
      JSON.stringify(description)
  )
    fail("fixture-description-conflict");
  if (existsSync(path) || existsSync(bodyPath)) fail("capture-exists");
  const headers = Object.fromEntries(
    Object.entries(request.headers ?? {}).map(function ([name, value]) {
      return [name.toLowerCase(), value];
    }),
  );
  headers["content-type"] = "application/json";
  headers["accept-encoding"] = "identity";
  const prepared: PreparedRequest = {
    messageFormat: request.messageFormat,
    provider: request.provider,
    model: request.model,
    name: request.name,
    url: request.url,
    authHeader: request.authHeader ?? AUTH[request.provider][0]!,
    method: "POST",
    headers,
    ...(request.replay === undefined ? {} : { replay: request.replay }),
  };
  for (const data of [description, prepared])
    scan(ENCODER.encode(JSON.stringify(data)), sensitiveValues(options));
  mkdirSync(folder, { recursive: true });
  if (!existsSync(descriptionPath))
    write(descriptionPath, description, sensitiveValues(options));
  write(bodyPath, ENCODER.encode(request.body), sensitiveValues(options));
  write(path, prepared, sensitiveValues(options));
  return path;
};

export default prepare;
