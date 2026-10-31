import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { resolve } from "node:path";
import Protocol from "@kuib-ai/protocol";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import readPrepared from "../read.prepared.request/index.ts";
import record from "../record.exchange/index.ts";
import createCaptureRequest from "../create.capture.request/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import ValidateRequest from "./index.ts";
import { existsSync, readdirSync } from "node:fs";
import type { CaptureRequest } from "../capture.request/index.ts";
import prepare from "../prepare.request/index.ts";

for (const [row, provider, model, path, limit] of [
  [
    "S/output-above-ceiling",
    Protocol.ProviderEnum.ANTHROPIC,
    Protocol.ModelEnum.CLAUDE_SONNET_5_5,
    "/v1/messages",
    128001,
  ],
  [
    "H/output-above-ceiling",
    Protocol.ProviderEnum.ANTHROPIC,
    Protocol.ModelEnum.CLAUDE_HAIKU_5_5,
    "/v1/messages",
    128001,
  ],
  [
    "L/output-above-ceiling",
    Protocol.ProviderEnum.ANTHROPIC,
    Protocol.ModelEnum.CLAUDE_HAIKU_4_5,
    "/v1/messages",
    64001,
  ],
  [
    "MA/output-above-ceiling",
    Protocol.ProviderEnum.XIAOMI,
    Protocol.ModelEnum.MIMO_V2_6_PRO,
    "/anthropic/v1/messages",
    131073,
  ],
  [
    "MO/output-above-ceiling",
    Protocol.ProviderEnum.XIAOMI,
    Protocol.ModelEnum.MIMO_V2_6_PRO,
    "/v1/chat/completions",
    131073,
  ],
] as const) {
  it(`allows only the named ${row} header-cut exception and reserves its full output`, async function () {
    using dir = createTempDir("capture-ceiling-");
    await using http = createLoopbackServer(function () {
      return new Response("unused answer");
    });
    const options = createCaptureOptions(dir.path, http.url);
    const nativeModel = row.startsWith("L/")
      ? "claude-haiku-4-5-20251001"
      : row.startsWith("H/")
        ? "claude-haiku-5-5"
        : row.startsWith("S/")
          ? "claude-sonnet-5-5"
          : "mimo-v2.6-pro";
    const requestChanges = {
      provider,
      model,
      messageFormat: path.includes("chat")
        ? Protocol.MessageFormatEnum.OPENAI_CHAT
        : Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
      url: `${http.url}${path}`,
      body: JSON.stringify({
        model: nativeModel,
        max_tokens: limit,
        messages: [],
      }),
    };
    const input = prepareCaptureTestCase(http.url, options, requestChanges, {
      row,
      cut: "headers",
    });
    const result = await record(input.path, input.run, options);
    expect(result.state).toBe("cancelled");
    expect(result.costUsd).toBeGreaterThan(0);
    expect(function () {
      readPrepared(
        input.path,
        { ...input.run, row: "unapproved/row" },
        options,
      );
    }).toThrow("output-limit");
    expect(function () {
      readPrepared(input.path, { ...input.run, cut: "text" }, options);
    }).toThrow("output-limit");
  });
}

it("refuses unapproved headers and invalid prices before a request is sent", function () {
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions("/var/tmp/synthetic-capture", origin);
  expect(function () {
    ValidateRequest.validate(
      createCaptureRequest(origin, { headers: { authorization: "not-a-key" } }),
      options,
    );
  }).toThrow("unsafe-header");
  const request = {
    ...createCaptureRequest(origin),
    ...createRecordInput({ price: { input: -1, output: 1, inputTokens: 1 } }),
  };
  expect(function () {
    ValidateRequest.validate(request, options, true);
  }).toThrow("invalid-price");
});

it("allows only the named initial Haiku 4.5 signed seed", function () {
  using dir = createTempDir("capture-signed-seed-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 32,
    messages: [],
  });
  const path = prepare(
    createCaptureRequest(origin, { name: "tool-seed-signed", body }),
    options,
  );
  expect(
    readPrepared(
      path,
      createRecordInput({
        row: "L/tool-seed-signed",
        signedRepeatOf: "L/tool-seed",
      }),
      options,
    ).request.signedRepeatOf,
  ).toBe("L/tool-seed");
  expect(function () {
    readPrepared(
      path,
      createRecordInput({
        row: "L/tool-seed-signed-max",
        signedRepeatOf: "L/tool-seed",
      }),
      options,
    );
  }).toThrow("invalid-signed-repeat");
});

it("rejects sensitive prepared body/description and credential or unknown request headers without creating files", function () {
  using dir = createTempDir("capture-prepared-refusal-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  const changes: Partial<CaptureRequest>[] = [
    {
      body: JSON.stringify({
        model: "synthetic-model",
        max_tokens: 32,
        messages: [{ role: "user", content: options.key }],
      }),
    },
    { shows: options.key },
    { headers: { Authorization: options.key } },
    { headers: { "x-account-id": "private-account" } },
    { headers: { "x-unknown": "unknown" } },
  ];
  for (const change of changes)
    expect(function () {
      prepare(createCaptureRequest(origin, change), options);
    }).toThrow();
  expect(existsSync(options.root)).toBe(false);
});

it("refuses traversal, symlinks, credential URLs, unapproved hosts and paths", function () {
  using dir = createTempDir("capture-path-refusal-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  for (const change of [
    { messageFormat: "../escape" as never },
    { name: "../escape" },
    { url: `${origin}/v1/messages?api-key=private` },
    { url: "http://private:secret@127.0.0.1:3210/v1/messages" },
    { url: "https://example.com/v1/messages" },
    { url: `${origin}/v1/models` },
  ])
    expect(function () {
      prepare(createCaptureRequest(origin, change), options);
    }).toThrow();
  const linkedRoot = resolve(import.meta.dirname!, "fixtures", "symlink-root");
  expect(function () {
    prepare(createCaptureRequest(origin), { ...options, root: linkedRoot });
  }).toThrow("unsafe-path");
  expect(readdirSync(resolve(linkedRoot, "..", "symlink-target"))).toEqual([
    "fixture.json",
  ]);
});

it("refuses an output above the ordinary cap before disk and invalid price before network", function () {
  using dir = createTempDir("capture-price-refusal-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  for (const body of [
    '{"model":"synthetic-model","max_tokens":128001}',
    '{"model":"synthetic-model","max_tokens":2.5}',
    '{"model":"synthetic-model","max_completion_tokens":32,"max_tokens":128001}',
  ])
    expect(function () {
      prepare(createCaptureRequest(origin, { body }), options);
    }).toThrow("output-limit");
  expect(existsSync(options.root)).toBe(false);
  const path = prepare(createCaptureRequest(origin), options);
  for (const price of [
    { input: 2, output: -1, inputTokens: 1 },
    { input: 2, output: Infinity, inputTokens: 1 },
  ])
    expect(function () {
      readPrepared(path, createRecordInput({ price }), options);
    }).toThrow("invalid-price");
});
