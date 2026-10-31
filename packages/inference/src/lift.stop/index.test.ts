import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync, writeFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import liftStop from "./index.ts";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import record from "../record.exchange/index.ts";

it("appends one reviewed authentication lift without changing the stopped call", function () {
  using dir = createTempDir("capture-lift-");
  const options = createCaptureOptions(dir.path, "http://127.0.0.1:3210");
  const base = {
    ordinal: 1,
    provider: "anthropic",
    fixture: "case",
    row: "row",
    time: options.time,
    costUsd: 0.001,
    stop: null,
  };
  const old = [
    { ...base, kind: "started" },
    { ...base, kind: "finished", stop: "authentication-failure" },
  ];
  writeFileSync(
    options.ledger,
    old
      .map(function (entry) {
        return JSON.stringify(entry);
      })
      .join("\n") + "\n",
  );
  liftStop(1, "reviewer", "credential scope reviewed", options);
  const rows = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(rows).toHaveLength(3);
  expect(rows[2].kind).toBe("lifted");
  expect(rows[1]).toEqual(old[1]);
});

it("lifts an old authentication scope without rewriting its call or count and keeps billing unreviewable", async function () {
  using dir = createTempDir("capture-auth-lift-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response("synthetic", {
      status: calls === 1 ? 401 : calls === 2 ? 200 : 402,
    });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const first = prepareCaptureTestCase(http.url, options);
  expect((await record(first.path, first.run, options)).stop).toBe(
    "authentication-failure",
  );
  const prefix = readFileSync(options.ledger, "utf8");
  const next = prepareCaptureTestCase(
    http.url,
    options,
    { name: "new-key" },
    { row: "synthetic/new-key" },
  );
  await expect(record(next.path, next.run, options)).rejects.toThrow(
    "provider-stopped",
  );
  liftStop(1, "orchestrator", "owner replaced the key", options);
  expect(readFileSync(options.ledger, "utf8").startsWith(prefix)).toBe(true);
  expect((await record(next.path, next.run, options)).status).toBe(200);
  const billed = prepareCaptureTestCase(
    http.url,
    options,
    { name: "billing" },
    { row: "synthetic/billing" },
  );
  expect((await record(billed.path, billed.run, options)).stop).toBe(
    "billing-failure",
  );
  expect(function () {
    liftStop(3, "reviewer", "reviewed", options);
  }).toThrow("stop-not-reviewable");
  expect(calls).toBe(3);
});

it("lifts only a reviewed safety stop by appending history and keeps its count and reservation", async function () {
  using dir = createTempDir("capture-safety-lift-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response(calls === 1 ? "synthetic-secret-key-93" : "OK");
  });
  const options = createCaptureOptions(dir.path, http.url);
  const first = prepareCaptureTestCase(http.url, options);
  await expect(record(first.path, first.run, options)).rejects.toThrow(
    "sensitive-data",
  );
  const prefix = readFileSync(options.ledger, "utf8");
  const repeat = prepareCaptureTestCase(
    http.url,
    options,
    { name: "diagnostic" },
    { row: "synthetic/diagnostic", diagnosticRepeatOf: 1 },
  );
  await expect(record(repeat.path, repeat.run, options)).rejects.toThrow(
    "provider-stopped",
  );
  expect(function () {
    liftStop(1, "", "reviewed", options);
  }).toThrow("invalid-stop-review");
  expect(function () {
    liftStop(2, "reviewer", "reviewed", options);
  }).toThrow("stop-not-reviewable");
  liftStop(1, "orchestrator", "reviewed diagnostic repeat", options);
  const lifted = readFileSync(options.ledger, "utf8");
  expect(lifted.startsWith(prefix)).toBe(true);
  expect(JSON.parse(lifted.trim().split("\n").at(-1)!)).toMatchObject({
    kind: "lifted",
    ordinal: 1,
    reviewer: "orchestrator",
  });
  expect(function () {
    liftStop(1, "orchestrator", "reviewed", options);
  }).toThrow("stop-already-lifted");
  await expect(
    record(repeat.path, repeat.run, { ...options, limits: { anthropic: 1 } }),
  ).rejects.toThrow("provider-count-limit");
  await expect(
    record(repeat.path, repeat.run, { ...options, budgetUsd: 0.000001 }),
  ).rejects.toThrow("capture-budget-limit");
  expect((await record(repeat.path, repeat.run, options)).status).toBe(200);
  const entries = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(
    entries
      .filter(function (entry) {
        return entry.kind === "started";
      })
      .map(function (entry) {
        return entry.ordinal;
      }),
  ).toEqual([1, 2]);
  expect(entries.at(-1).diagnosticRepeatOf).toBe(1);
  expect(entries[1].costUsd).toBeGreaterThan(0);
  await expect(record(first.path, first.run, options)).rejects.toThrow(
    "already-started",
  );
  const another = prepareCaptureTestCase(
    http.url,
    options,
    { name: "another-diagnostic" },
    { row: "synthetic/another", diagnosticRepeatOf: 1 },
  );
  await expect(record(another.path, another.run, options)).rejects.toThrow(
    "diagnostic-already-started",
  );
  expect(calls).toBe(2);
});

it("keeps a diagnostic refusal stopped until its own later review", async function () {
  using dir = createTempDir("capture-diagnostic-stop-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response("synthetic-secret-key-93");
  });
  const options = createCaptureOptions(dir.path, http.url);
  const first = prepareCaptureTestCase(http.url, options);
  await expect(record(first.path, first.run, options)).rejects.toThrow(
    "sensitive-data",
  );
  liftStop(1, "orchestrator", "reviewed", options);
  const repeat = prepareCaptureTestCase(
    http.url,
    options,
    { name: "diagnostic" },
    { row: "synthetic/diagnostic", diagnosticRepeatOf: 1 },
  );
  await expect(record(repeat.path, repeat.run, options)).rejects.toThrow(
    "sensitive-data",
  );
  const next = prepareCaptureTestCase(
    http.url,
    options,
    { name: "next" },
    { row: "synthetic/next" },
  );
  await expect(record(next.path, next.run, options)).rejects.toThrow(
    "provider-stopped",
  );
  expect(calls).toBe(2);
});
