// @claim core/provider-captures
import { dirname } from "node:path";
import { appendFileSync, mkdirSync } from "node:fs";
import type { CaptureOptions } from "../capture.options/index.ts";
import type { LedgerEntry } from "../ledger.entry/index.ts";
import type { LiftedLedgerEntry } from "../lifted.ledger.entry/index.ts";
import type { RepricedLedgerEntry } from "../repriced.ledger.entry/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";

const { ENCODER, scan } = ScanSensitiveBytesUnit;

const append = function (
  entry: LedgerEntry | LiftedLedgerEntry | RepricedLedgerEntry,
  options: CaptureOptions,
  values: string[],
): void {
  const bytes = ENCODER.encode(`${JSON.stringify(entry)}\n`);
  scan(bytes, values);
  mkdirSync(dirname(options.ledger), { recursive: true });
  appendFileSync(options.ledger, bytes);
};

export default append;
