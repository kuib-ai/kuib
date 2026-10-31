// @claim core/provider-captures
import { dirname } from "node:path";
import { mkdirSync, openSync, closeSync, rmSync } from "node:fs";
import type { CaptureOptions } from "../capture.options/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ledger from "../read.ledger/index.ts";
import append from "../append.ledger/index.ts";
import withError from "@kuib-ai/std/with.error";

const { ENCODER, scan, sensitiveValues } = ScanSensitiveBytesUnit;
const { fail } = RefuseCaptureUnit;

const reprice = function (
  ordinal: number,
  costUsd: number,
  reviewer: string,
  reason: string,
  options: CaptureOptions,
): void {
  if (
    !Number.isInteger(ordinal) ||
    ordinal < 1 ||
    costUsd !== 0 ||
    typeof reviewer !== "string" ||
    !reviewer.trim() ||
    typeof reason !== "string" ||
    !reason.trim()
  )
    fail("invalid-reprice-review");
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
  const entries = ledger(options);
  if (
    !entries.some(function (entry) {
      return (
        entry.kind === "finished" &&
        entry.ordinal === ordinal &&
        entry.status === 400 &&
        entry.usage === null &&
        entry.costUsd > 0
      );
    })
  )
    fail("reprice-not-rejected");
  if (
    entries.some(function (entry) {
      return entry.kind === "repriced" && entry.ordinal === ordinal;
    })
  )
    fail("already-repriced");
  append(
    {
      kind: "repriced",
      ordinal,
      costUsd,
      reviewer,
      reason,
      time: options.time ?? new Date().toISOString(),
    },
    options,
    sensitiveValues(options),
  );
};

export default reprice;
