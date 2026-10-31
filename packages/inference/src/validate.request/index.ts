// @claim core/provider-captures
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import Protocol from "@kuib-ai/protocol";
import fixturePath from "@kuib-ai/inference/fixture.path";
import type { CaptureRequest } from "../capture.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import safePath from "../resolve.capture.path/index.ts";

const { ENCODER, scan, sensitiveValues } = ScanSensitiveBytesUnit;
const { CaptureError, fail } = RefuseCaptureUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const MAX_BYTES = 16 * 1024 * 1024;
const OUTPUT_LIMITS: Record<
  string,
  { provider: ProviderEnum; model: string; path: string; limit: number }
> = {
  "S/output-above-ceiling": {
    provider: Protocol.ProviderEnum.ANTHROPIC,
    model: "claude-sonnet-5-5",
    path: "/v1/messages",
    limit: 128001,
  },
  "H/output-above-ceiling": {
    provider: Protocol.ProviderEnum.ANTHROPIC,
    model: "claude-haiku-5-5",
    path: "/v1/messages",
    limit: 128001,
  },
  "L/output-above-ceiling": {
    provider: Protocol.ProviderEnum.ANTHROPIC,
    model: "claude-haiku-4-5-20251001",
    path: "/v1/messages",
    limit: 64001,
  },
  "MA/output-above-ceiling": {
    provider: Protocol.ProviderEnum.XIAOMI,
    model: "mimo-v2.6-pro",
    path: "/anthropic/v1/messages",
    limit: 131073,
  },
  "MO/output-above-ceiling": {
    provider: Protocol.ProviderEnum.XIAOMI,
    model: "mimo-v2.6-pro",
    path: "/v1/chat/completions",
    limit: 131073,
  },
};

const ORIGINS: Record<ProviderEnum, string[]> = {
  [Protocol.ProviderEnum.ANTHROPIC]: ["https://api.anthropic.com"],
  [Protocol.ProviderEnum.XIAOMI]: [
    "https://token-plan-sgp.xiaomimimo.com",
    "https://api.xiaomimimo.com",
  ],
  [Protocol.ProviderEnum.META]: ["https://api.meta.ai"],
};

const AUTH: Record<ProviderEnum, string[]> = {
  [Protocol.ProviderEnum.ANTHROPIC]: ["x-api-key", "authorization"],
  [Protocol.ProviderEnum.XIAOMI]: ["api-key", "authorization", "x-api-key"],
  [Protocol.ProviderEnum.META]: ["authorization"],
};
const REQUEST_HEADERS = new Set([
  "content-type",
  "accept",
  "accept-encoding",
  "anthropic-version",
  "anthropic-beta",
]);
const RESPONSE_HEADERS = new Set([
  "content-type",
  "content-length",
  "content-encoding",
  "date",
  "cache-control",
  "retry-after",
  "request-id",
  "x-request-id",
  "openai-version",
  "openai-processing-ms",
]);
const IDENTITY_HEADER =
  /authorization|api[-_]?key|auth[-_]?token|access[-_]?token|cookie|account|organi[sz]ation|project|workspace|user|session|credential|secret/;
const RATE_HEADER =
  /^(anthropic-ratelimit-(requests|tokens|input-tokens|output-tokens)-(limit|remaining|reset)|x-ratelimit-(limit|remaining|reset)-(requests|tokens|project-tokens))$/;

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const validateProvider = function (provider: unknown): ProviderEnum {
  if (Object.values(Protocol.ProviderEnum).includes(provider as ProviderEnum))
    return provider as ProviderEnum;
  return fail("invalid-provider");
};

const validate = function (
  request: CaptureRequest & Partial<RecordInput>,
  options: CaptureOptions,
  recording = false,
): void {
  validateProvider(request.provider);
  if (
    !Object.values(Protocol.MessageFormatEnum).includes(
      request.messageFormat,
    ) ||
    !Object.values(Protocol.ModelEnum).includes(request.model)
  )
    fail("invalid-identity");
  if (!NAME.test(request.name)) fail("invalid-name");
  if (
    (recording &&
      (typeof request.row !== "string" || request.row.length === 0)) ||
    typeof request.shows !== "string" ||
    request.shows.trim().length === 0
  )
    fail("invalid-description");
  if (!URL.canParse(request.url)) return fail("invalid-url");
  const url = new URL(request.url);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !(options.origins ?? ORIGINS[request.provider]).includes(url.origin)
  )
    fail("unsafe-url");
  const paths =
    request.provider === Protocol.ProviderEnum.ANTHROPIC
      ? ["/v1/messages"]
      : request.provider === Protocol.ProviderEnum.META
        ? ["/v1/chat/completions"]
        : ["/anthropic/v1/messages", "/v1/chat/completions"];
  if (!paths.includes(url.pathname)) fail("unsafe-url");
  const auth = request.authHeader ?? AUTH[request.provider][0]!;
  if (!AUTH[request.provider].includes(auth)) fail("invalid-auth-header");
  if (typeof options.key !== "string" || options.key.length === 0)
    fail("missing-key");
  if (
    typeof request.body !== "string" ||
    ENCODER.encode(request.body).length > MAX_BYTES
  )
    throw new CaptureError("invalid-body");
  const body = object(parseJson(request.body));
  if (
    body === null ||
    typeof body.model !== "string" ||
    body.model.length === 0
  )
    throw new CaptureError("invalid-body");
  const limits = [body.max_completion_tokens, body.max_tokens].filter(
    function (value) {
      return value !== undefined;
    },
  );
  const exception = OUTPUT_LIMITS[request.ceilingRepeatOf ?? request.row ?? ""];
  const permitted = recording
    ? request.cut === "headers" &&
      exception !== undefined &&
      exception.provider === request.provider &&
      exception.model === body.model &&
      exception.path === url.pathname
    : Object.values(OUTPUT_LIMITS).some(function (candidate) {
        return (
          candidate.provider === request.provider &&
          candidate.model === body.model &&
          candidate.path === url.pathname &&
          limits.every(function (limit) {
            return limit === candidate.limit;
          })
        );
      });
  if (
    limits.length === 0 ||
    limits.some(function (limit) {
      return (
        typeof limit !== "number" ||
        !Number.isInteger(limit) ||
        (limit > 2048 &&
          (!permitted || (recording && limit !== exception!.limit))) ||
        limit < -1
      );
    })
  )
    fail("output-limit");
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (!REQUEST_HEADERS.has(name.toLowerCase()) || typeof value !== "string")
      fail("unsafe-header");
  }
  if (
    request.cut !== undefined &&
    !["text", "thinking", "headers"].includes(request.cut)
  )
    fail("invalid-cut");
  if (
    request.diagnosticRepeatOf !== undefined &&
    (!Number.isInteger(request.diagnosticRepeatOf) ||
      request.diagnosticRepeatOf < 1)
  )
    fail("invalid-diagnostic-repeat");
  if (request.signedRepeatOf !== undefined) {
    const source = request.signedRepeatOf;
    if (
      typeof source !== "string" ||
      !/^(?:L\/tool-seed|(S|H)\/(tool-seed|tool-replay(?:-(?:no-reasoning|empty-signature|no-signature|error|false|cache))?|tool-order-invalid|inline-between-call-result|inline-after-result|binding-(?:default|error|drop_block|no-beta)|changed-tools|cache-thinking|cross-model-(?:s|h)|reasoning-(?:json|stream|outside-omit|outside-keep)|cut-thinking(?:-replay)?))$/.test(
        source,
      ) ||
      (source.startsWith("H/") && /\/(reasoning-|cut-thinking)/.test(source)) ||
      (source.endsWith("cross-model-s") && !source.startsWith("H/")) ||
      (source.endsWith("cross-model-h") && !source.startsWith("S/")) ||
      ![
        `${source}-signed`,
        ...(/^(S|H)\/tool-seed$/.test(source)
          ? [`${source}-signed-max`, `${source}-signed-hard`]
          : []),
        ...(source === "S/reasoning-json" ? [`${source}-signed-max`] : []),
        ...(/^S\/reasoning-outside-(omit|keep)$/.test(source)
          ? [`${source}-signed-json-max`, `${source}-signed-stream`]
          : []),
      ].includes(request.row ?? "") ||
      request.provider !== Protocol.ProviderEnum.ANTHROPIC ||
      body.model !==
        OUTPUT_LIMITS[`${source[0]}/output-above-ceiling`]!.model ||
      url.pathname !== "/v1/messages" ||
      request.diagnosticRepeatOf !== undefined ||
      request.ceilingRepeatOf !== undefined ||
      request.admissionRepeatOf !== undefined
    )
      fail("invalid-signed-repeat");
    if (
      /^S\/reasoning-outside-(omit|keep)-signed-(json-max|stream)$/.test(
        request.row ?? "",
      ) &&
      request.replay?.fixture !==
        fixturePath(
          Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
          Protocol.ProviderEnum.ANTHROPIC,
          Protocol.ModelEnum.CLAUDE_SONNET_5_5,
          `reasoning-${request.row?.endsWith("-json-max") ? "json-signed-max" : "stream-signed"}`,
        )
    )
      fail("invalid-signed-repeat");
  }
  if (request.ceilingRepeatOf !== undefined) {
    const source = request.ceilingRepeatOf;
    if (
      typeof source !== "string" ||
      !/^(S|H|L)\/output-above-ceiling$/.test(source) ||
      request.row !== `${source}-repeat` ||
      !permitted ||
      limits.some(function (limit) {
        return limit !== exception!.limit;
      }) ||
      request.diagnosticRepeatOf !== undefined ||
      request.signedRepeatOf !== undefined
    )
      fail("invalid-ceiling-repeat");
  }
  if (request.admissionRepeatOf !== undefined) {
    const source = request.admissionRepeatOf;
    if (
      typeof source !== "string" ||
      !/^(MA|MO)\/host-sgp$/.test(source) ||
      request.row !== `${source}-repeat` ||
      request.provider !== Protocol.ProviderEnum.XIAOMI ||
      body.model !== "mimo-v2.6-pro" ||
      url.pathname !==
        OUTPUT_LIMITS[`${source.slice(0, 2)}/output-above-ceiling`]!.path ||
      request.signedRepeatOf !== undefined ||
      request.ceilingRepeatOf !== undefined ||
      request.diagnosticRepeatOf !== undefined
    )
      fail("invalid-admission-repeat");
  }
  const price = object(request.price);
  if (
    recording &&
    (price === null ||
      typeof price.input !== "number" ||
      typeof price.output !== "number" ||
      typeof price.inputTokens !== "number")
  )
    fail("invalid-price");
  for (const value of Object.values(price ?? {})) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
      fail("invalid-price");
  }
  if (request.replay !== undefined) {
    if (
      typeof request.replay.fixture !== "string" ||
      !Array.isArray(request.replay.changes) ||
      !request.replay.changes.every(function (change) {
        return typeof change === "string";
      })
    )
      fail("invalid-replay");
    safePath(options.root, request.replay.fixture);
  }
  scan(ENCODER.encode(JSON.stringify(request)), sensitiveValues(options));
};

export default {
  MAX_BYTES,
  OUTPUT_LIMITS,
  ORIGINS,
  AUTH,
  RESPONSE_HEADERS,
  IDENTITY_HEADER,
  RATE_HEADER,
  NAME,
  validateProvider,
  validate,
};
