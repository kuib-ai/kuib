// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import fixturePath from "@kuib-ai/inference/fixture.path";
import { existsSync, readFileSync } from "node:fs";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { RecordRequest } from "../record.request/index.ts";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { LedgerEntry } from "../ledger.entry/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import bytesHash from "../hash.bytes/index.ts";
import safePath from "../resolve.capture.path/index.ts";
import ledger from "../read.ledger/index.ts";
import reserved from "../reserve.request/index.ts";

const { ENCODER } = ScanSensitiveBytesUnit;
const { AUTH } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const LIMITS: Record<ProviderEnum, number> = {
  [Protocol.ProviderEnum.ANTHROPIC]: 384,
  [Protocol.ProviderEnum.XIAOMI]: 226,
  [Protocol.ProviderEnum.META]: 102,
};
const authenticationScope = function (
  entry: LedgerEntry,
  started: LedgerEntry[],
  options: CaptureOptions,
): string | null {
  const source =
    started.find(function (value) {
      return value.ordinal === entry.ordinal;
    }) ?? entry;
  let url = source.url;
  let header = source.authHeader;
  if (url === undefined || header === undefined) {
    const path = safePath(options.root, entry.fixture, "request.json");
    if (!existsSync(path)) return null;
    const prepared = object(parseJson(readFileSync(path, "utf8")));
    if (prepared === null) return null;
    url ??= typeof prepared.url === "string" ? prepared.url : undefined;
    header ??=
      typeof prepared.authHeader === "string" ? prepared.authHeader : undefined;
  }
  if (url === undefined || header === undefined) return null;
  const address = new URL(url);
  return JSON.stringify([
    address.origin,
    address.pathname,
    header.toLowerCase(),
  ]);
};

const allowance = function (
  request: RecordRequest,
  options: CaptureOptions,
): number {
  const entries = ledger(options);
  const lifted = new Set(
    entries
      .filter(function (entry) {
        return entry.kind === "lifted";
      })
      .map(function (entry) {
        return entry.ordinal;
      }),
  );
  const started = entries.filter(function (entry): entry is LedgerEntry {
    return entry.kind === "started";
  });
  const own = started.filter(function (entry) {
    return entry.provider === request.provider;
  });
  const address = new URL(request.url);
  const scope = JSON.stringify([
    address.origin,
    address.pathname,
    (request.authHeader ?? AUTH[request.provider][0]!).toLowerCase(),
  ]);
  if (
    entries.some(function (entry) {
      if (entry.kind === "lifted" || entry.kind === "repriced") return false;
      if (entry.stop === "sensitive-data") return !lifted.has(entry.ordinal);
      if (entry.provider !== request.provider || entry.stop === null)
        return false;
      if (entry.stop !== "authentication-failure") return true;
      if (lifted.has(entry.ordinal)) return false;
      const failed = authenticationScope(entry, started, options);
      return failed === null || failed === scope;
    })
  )
    fail("provider-stopped");
  if (
    own.some(function (entry) {
      return (
        entry.fixture ===
          fixturePath(
            request.messageFormat,
            request.provider,
            request.model,
            request.name,
          ) ||
        ((request.signedRepeatOf !== undefined ||
          request.ceilingRepeatOf !== undefined ||
          request.admissionRepeatOf !== undefined) &&
          entry.row === request.row)
      );
    })
  )
    fail("already-started");
  if (
    /^S\/reasoning-outside-(omit|keep)-signed-(json-max|stream)$/.test(
      request.row,
    ) &&
    started.some(function (entry) {
      return (
        entry.signedRepeatOf === request.signedRepeatOf &&
        /^S\/reasoning-outside-(omit|keep)-signed-(json-max|stream)$/.test(
          entry.row,
        )
      );
    })
  )
    fail("signed-already-started");
  if (request.diagnosticRepeatOf !== undefined) {
    const source = started.find(function (entry) {
      return entry.ordinal === request.diagnosticRepeatOf;
    });
    if (
      !source ||
      source.provider !== request.provider ||
      source.bodyHash !== bytesHash(ENCODER.encode(request.body)) ||
      !lifted.has(request.diagnosticRepeatOf) ||
      !entries.some(function (entry) {
        return (
          entry.kind === "finished" &&
          entry.ordinal === request.diagnosticRepeatOf &&
          entry.stop === "sensitive-data"
        );
      })
    )
      fail("invalid-diagnostic-repeat");
    if (
      started.some(function (entry) {
        return entry.diagnosticRepeatOf === request.diagnosticRepeatOf;
      })
    )
      fail("diagnostic-already-started");
  }
  if (request.ceilingRepeatOf !== undefined) {
    const source = started.find(function (entry) {
      return entry.row === request.ceilingRepeatOf;
    });
    if (
      source === undefined ||
      source.provider !== request.provider ||
      source.bodyHash !== bytesHash(ENCODER.encode(request.body))
    )
      fail("invalid-ceiling-repeat");
  }
  const limit = Math.min(
    LIMITS[request.provider],
    options.limits?.[request.provider] ?? LIMITS[request.provider],
  );
  if (!Number.isInteger(limit) || limit < 0 || own.length >= limit)
    fail("provider-count-limit");
  const budget = Math.min(5, options.budgetUsd ?? 5);
  if (!Number.isFinite(budget) || budget < 0) fail("invalid-budget");
  const costs = new Map<number, number>();
  for (const entry of entries) {
    if (entry.kind === "lifted") continue;
    if (entry.kind === "started") {
      if (costs.has(entry.ordinal)) fail("invalid-ledger");
      costs.set(entry.ordinal, entry.costUsd);
      continue;
    }
    if (!costs.has(entry.ordinal)) fail("invalid-ledger");
    costs.set(entry.ordinal, entry.costUsd);
  }
  const spent = [...costs.values()].reduce(function (total, cost) {
    return total + cost;
  }, 0);
  if (spent + reserved(request) > budget) fail("capture-budget-limit");
  return started.length + 1;
};

export default allowance;
