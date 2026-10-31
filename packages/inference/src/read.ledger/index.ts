// @claim core/provider-captures
import { existsSync, readFileSync } from "node:fs";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { LedgerEntry } from "../ledger.entry/index.ts";
import type { LiftedLedgerEntry } from "../lifted.ledger.entry/index.ts";
import type { RepricedLedgerEntry } from "../repriced.ledger.entry/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";

const { scan, sensitiveValues } = ScanSensitiveBytesUnit;
const { validateProvider } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const ledger = function (
  options: CaptureOptions,
): (LedgerEntry | LiftedLedgerEntry | RepricedLedgerEntry)[] {
  if (!existsSync(options.ledger)) return [];
  scan(readFileSync(options.ledger), sensitiveValues(options));
  const entries = readFileSync(options.ledger, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(function (line) {
      const entry = parseJson(line) as
        LedgerEntry | LiftedLedgerEntry | RepricedLedgerEntry;
      if (entry.kind === "lifted" || entry.kind === "repriced") {
        if (
          !Number.isInteger(entry.ordinal) ||
          entry.ordinal < 1 ||
          typeof entry.reviewer !== "string" ||
          !entry.reviewer.trim() ||
          typeof entry.reason !== "string" ||
          !entry.reason.trim() ||
          (entry.kind === "repriced" && entry.costUsd !== 0)
        )
          fail("invalid-ledger");
        return entry;
      }
      if (
        !["started", "finished"].includes(entry.kind) ||
        !Number.isInteger(entry.ordinal) ||
        entry.ordinal < 1 ||
        typeof entry.costUsd !== "number" ||
        !Number.isFinite(entry.costUsd) ||
        entry.costUsd < 0 ||
        (entry.stop !== null && typeof entry.stop !== "string")
      )
        fail("invalid-ledger");
      if (entry.price !== undefined) {
        const price = object(entry.price);
        if (
          price === null ||
          typeof price.input !== "number" ||
          typeof price.output !== "number" ||
          typeof price.inputTokens !== "number" ||
          Object.values(price).some(function (value) {
            return (
              typeof value !== "number" || !Number.isFinite(value) || value < 0
            );
          })
        )
          fail("invalid-ledger");
      }
      validateProvider(entry.provider);
      return entry;
    });
  const lifted = new Set<number>();
  for (const [index, entry] of entries.entries()) {
    if (entry.kind !== "lifted") continue;
    if (
      lifted.has(entry.ordinal) ||
      !entries.slice(0, index).some(function (previous) {
        return (
          previous.kind === "finished" &&
          previous.ordinal === entry.ordinal &&
          ["sensitive-data", "authentication-failure"].includes(
            previous.stop ?? "",
          )
        );
      })
    )
      fail("invalid-ledger");
    lifted.add(entry.ordinal);
  }
  const repriced = new Set<number>();
  for (const [index, entry] of entries.entries()) {
    if (entry.kind !== "repriced") continue;
    if (
      repriced.has(entry.ordinal) ||
      !entries.slice(0, index).some(function (previous) {
        return (
          previous.kind === "finished" &&
          previous.ordinal === entry.ordinal &&
          previous.status === 400 &&
          previous.usage === null &&
          previous.costUsd > 0
        );
      })
    )
      fail("invalid-ledger");
    repriced.add(entry.ordinal);
  }
  return entries;
};

export default ledger;
