import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import Protocol from "@kuib-ai/protocol";
import append from "./index.ts";

it("appends a started row without changing earlier history", function () {
  using dir = createTempDir("capture-ledger-");
  const options = createCaptureOptions(dir.path, "http://127.0.0.1:3210");
  const entry = {
    kind: "started" as const,
    ordinal: 1,
    provider: Protocol.ProviderEnum.ANTHROPIC,
    fixture: "anthropic-messages/anthropic/claude-sonnet-5-5/plain",
    row: "synthetic/plain",
    time: options.time!,
    costUsd: 0.001,
    stop: null,
  };
  append(entry, options, [options.key]);
  append({ ...entry, kind: "finished" }, options, [options.key]);
  const rows = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(
    rows.map(function (row) {
      return row.kind;
    }),
  ).toEqual(["started", "finished"]);
});
