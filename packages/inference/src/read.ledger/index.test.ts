import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { writeFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import ledger from "./index.ts";

it("refuses a negative recorded cost without rewriting the ledger", function () {
  using dir = createTempDir("capture-ledger-read-");
  const options = createCaptureOptions(dir.path, "http://127.0.0.1:3210");
  const text =
    JSON.stringify({
      kind: "started",
      ordinal: 1,
      provider: "anthropic",
      fixture: "case",
      row: "row",
      time: options.time,
      costUsd: -1,
      stop: null,
    }) + "\n";
  writeFileSync(options.ledger, text);
  expect(function () {
    ledger(options);
  }).toThrow("invalid-ledger");
});
