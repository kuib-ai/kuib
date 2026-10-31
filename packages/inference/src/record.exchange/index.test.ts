import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureRequest from "../create.capture.request/index.ts";
import createCaptureOptions from "../create.capture.options/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import prepare from "../prepare.request/index.ts";
import record from "./index.ts";
import Protocol from "@kuib-ai/protocol";
import fixturePath from "@kuib-ai/inference/fixture.path";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import loadFixture from "@kuib-ai/testing/load.fixture";
import sequence from "../sequence.requests/index.ts";

it("records loopback bytes and writes row and price only to ledger history", async function () {
  using dir = createTempDir("capture-record-");
  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0, onListen: function () {} },
    function () {
      return new Response('{"usage":{"input_tokens":5,"output_tokens":2}}', {
        headers: { "content-type": "application/json" },
      });
    },
  );
  await using _serving = {
    async [Symbol.asyncDispose]() {
      await server.shutdown();
    },
  };
  const origin = `http://127.0.0.1:${server.addr.port}`;
  const options = createCaptureOptions(dir.path, origin);
  const path = prepare(createCaptureRequest(origin), options);
  const result = await record(path, createRecordInput(), options);
  expect(result.status).toBe(200);
  expect(existsSync(join(path, "..", "response.body"))).toBe(true);
  const prepared = JSON.parse(readFileSync(path, "utf8"));
  const rows = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(prepared.price).toBeUndefined();
  expect(rows[0].price.output).toBe(10);
  expect(rows[1].kind).toBe("finished");
});

it("refuses overwrites and never starts an already-recorded or crash-started request twice", async function () {
  using dir = createTempDir("capture-overwrite-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response("OK");
  });
  const options = createCaptureOptions(dir.path, http.url);
  const request = createCaptureRequest(http.url);
  const first = prepareCaptureTestCase(http.url, options);
  expect(function () {
    prepare(request, options);
  }).toThrow("capture-exists");
  await record(first.path, first.run, options);
  await expect(record(first.path, first.run, options)).rejects.toThrow(
    "capture-exists",
  );
  const second = prepareCaptureTestCase(
    http.url,
    options,
    { name: "crash" },
    { row: "synthetic/crash" },
  );
  const started = {
    kind: "started",
    ordinal: 2,
    provider: Protocol.ProviderEnum.ANTHROPIC,
    fixture: fixturePath(
      Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
      Protocol.ProviderEnum.ANTHROPIC,
      Protocol.ModelEnum.CLAUDE_SONNET_5_5,
      "crash",
    ),
    row: "synthetic/crash",
    time: options.time,
    costUsd: 0.01,
    stop: null,
  };
  writeFileSync(
    options.ledger,
    readFileSync(options.ledger, "utf8") + JSON.stringify(started) + "\n",
  );
  await expect(record(second.path, second.run, options)).rejects.toThrow(
    "already-started",
  );
  expect(calls).toBe(1);
});

it("refuses a concurrent invocation before its request reaches the real server", async function () {
  using dir = createTempDir("capture-concurrent-");
  const arrived = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  let calls = 0;
  await using http = createLoopbackServer(async function () {
    calls++;
    arrived.resolve();
    await finish.promise;
    return new Response("OK");
  });
  const options = createCaptureOptions(dir.path, http.url);
  const first = prepareCaptureTestCase(http.url, options);
  const second = prepareCaptureTestCase(
    http.url,
    options,
    { name: "second" },
    { row: "synthetic/second" },
  );
  const running = record(first.path, first.run, options);
  await using _finish = {
    async [Symbol.asyncDispose]() {
      finish.resolve();
      await running;
    },
  };
  await arrived.promise;
  await expect(record(second.path, second.run, options)).rejects.toThrow(
    "capture-running",
  );
  expect(calls).toBe(1);
  finish.resolve();
  await running;
  expect(existsSync(`${options.ledger}.lock`)).toBe(false);
  await record(second.path, second.run, options);
  expect(calls).toBe(2);
});

it("captures a complete nonstream JSON answer and an HTTP rejection in the same layout", async function () {
  using dir = createTempDir("capture-json-rejection-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return calls === 1
      ? Response.json({
          content: [{ type: "text", text: "OK" }],
          usage: { input_tokens: 5, output_tokens: 1 },
        })
      : Response.json(
          {
            type: "error",
            error: {
              type: "invalid_request_error",
              message: "synthetic rejection",
            },
          },
          { status: 400 },
        );
  });
  const options = createCaptureOptions(dir.path, http.url);
  const first = prepareCaptureTestCase(
    http.url,
    options,
    { name: "json" },
    { row: "synthetic/json" },
  );
  const second = prepareCaptureTestCase(
    http.url,
    options,
    { name: "rejection" },
    { row: "synthetic/rejection" },
  );
  const run = await sequence([first, second], {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(
    run.results.map(function (result) {
      return result.status;
    }),
  ).toEqual([200, 400]);
  expect(
    JSON.parse(
      readFileSync(join(dirname(second.path), "response.json"), "utf8"),
    ).status,
  ).toBe(400);
  expect(
    readFileSync(join(dirname(second.path), "response.body"), "utf8"),
  ).toContain("synthetic rejection");
  expect(run.results[1]!.costUsd).toBe(0);
});

it("loads nested format/provider/model/case fixtures with the real loader and replays the same prepared request bytes", async function () {
  using dir = createTempDir("capture-nested-loader-");
  let received = "";
  await using http = createLoopbackServer(async function (incoming) {
    received = await incoming.text();
    return Response.json({ content: "OK" });
  });
  const options = createCaptureOptions(dir.path, http.url);
  mkdirSync(join(dir.path, "src"));
  writeFileSync(join(dir.path, "package.json"), "{}\n");
  const first = prepareCaptureTestCase(http.url, options);
  await record(first.path, first.run, options);
  const name = fixturePath(
    Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
    Protocol.ProviderEnum.ANTHROPIC,
    Protocol.ModelEnum.CLAUDE_SONNET_5_5,
    "plain",
  );
  const fixture = loadFixture(join(dir.path, "src", "nested.ts"), name);
  expect(fixture.origin).toBe("recorded");
  expect(fixture.files).toContain("response.body");
  const second = prepareCaptureTestCase(
    http.url,
    options,
    {
      name: "plain-repeat",
      body: fixture.text("request.body"),
      replay: { fixture: name, changes: ["repeat-request-only"] },
    },
    { row: "synthetic/plain-repeat" },
  );
  await record(second.path, second.run, options);
  expect(received).toBe(fixture.text("request.body"));
  expect(fixture.files).not.toContain("sequence.json");
});
