import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync, writeFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import reprice from "./index.ts";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import record from "../record.exchange/index.ts";

it("appends a zero-cost review for a complete unbilled 400", function () {
  using dir = createTempDir("capture-reprice-");
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
  writeFileSync(
    options.ledger,
    [
      JSON.stringify({ ...base, kind: "started" }),
      JSON.stringify({ ...base, kind: "finished", status: 400, usage: null }),
    ].join("\n") + "\n",
  );
  reprice(1, 0, "reviewer", "confirmed unbilled", options);
  const rows = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(rows[2]).toMatchObject({ kind: "repriced", ordinal: 1, costUsd: 0 });
});

it("reprices an unbilled 400 reservation append-only and applies it to the next budget allowance", async function () {
  using dir = createTempDir("capture-reprice-run-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    if (calls === 1)
      return new Response(
        new ReadableStream({
          start: function (controller) {
            controller.enqueue(new TextEncoder().encode("partial error"));
          },
          cancel: function () {},
        }),
        { status: 400 },
      );
    return Response.json({ usage: { input_tokens: 1, output_tokens: 1 } });
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    timeoutMs: 50,
  };
  const first = prepareCaptureTestCase(http.url, options);
  const result = await record(first.path, first.run, options);
  expect(result.state).toBe("read-failed");
  expect(result.costUsd).toBeGreaterThan(0);
  const prefix = readFileSync(options.ledger, "utf8");
  const next = prepareCaptureTestCase(
    http.url,
    options,
    { name: "next" },
    { row: "synthetic/next" },
  );
  await expect(
    record(next.path, next.run, {
      ...options,
      budgetUsd: result.costUsd * 1.1,
    }),
  ).rejects.toThrow("capture-budget-limit");
  reprice(1, 0, "orchestrator", "rejected with 400, not billed", options);
  expect(readFileSync(options.ledger, "utf8").startsWith(prefix)).toBe(true);
  expect(
    JSON.parse(readFileSync(options.ledger, "utf8").trim().split("\n").at(-1)!),
  ).toMatchObject({
    kind: "repriced",
    ordinal: 1,
    costUsd: 0,
    reviewer: "orchestrator",
  });
  expect(
    (
      await record(next.path, next.run, {
        ...options,
        budgetUsd: result.costUsd * 1.1,
      })
    ).status,
  ).toBe(200);
  expect(function () {
    reprice(1, 0, "reviewer", "again", options);
  }).toThrow("already-repriced");
  expect(function () {
    reprice(2, 0, "reviewer", "billed success", options);
  }).toThrow("reprice-not-rejected");
  expect(calls).toBe(2);
});
