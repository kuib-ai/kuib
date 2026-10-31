import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import record from "../record.exchange/index.ts";
import Protocol from "@kuib-ai/protocol";
import createCaptureRequest from "../create.capture.request/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import costOf from "./index.ts";

it("uses reported usage on a complete 4xx answer rather than treating it as an unbilled rejection", async function () {
  using dir = createTempDir("capture-4xx-usage-");
  await using http = createLoopbackServer(function () {
    return Response.json(
      { usage: { input_tokens: 10, output_tokens: 2 } },
      { status: 400 },
    );
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  const result = await record(input.path, input.run, options);
  expect(result.costUsd).toBeCloseTo(0.00004, 8);
  expect(result.usage).toEqual({ input_tokens: 10, output_tokens: 2 });
});

it("keeps full reservations when a 4xx response is cancelled or its body times out", async function () {
  using dir = createTempDir("capture-4xx-cut-");
  await using http = createLoopbackServer(function () {
    return new Response(
      new ReadableStream({
        start: function (controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"synthetic partial rejection"}}\n\n',
            ),
          );
        },
        cancel: function () {},
      }),
      { status: 400 },
    );
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    timeoutMs: 50,
  };
  const cancelled = prepareCaptureTestCase(
    http.url,
    options,
    { name: "cancelled-rejection" },
    { row: "synthetic/cancelled", cut: "text" },
  );
  const timedOut = prepareCaptureTestCase(
    http.url,
    options,
    { name: "timed-out-rejection" },
    { row: "synthetic/timed-out" },
  );
  const first = await record(cancelled.path, cancelled.run, options);
  const second = await record(timedOut.path, timedOut.run, options);
  expect(first.state).toBe("cancelled");
  expect(second.state).toBe("read-failed");
  expect(first.status).toBe(400);
  expect(second.status).toBe(400);
  expect(first.costUsd).toBeGreaterThan(0);
  expect(second.costUsd).toBe(first.costUsd);
});

it("keeps final OpenAI usage chunks and reasoning tokens verbatim", async function () {
  using dir = createTempDir("capture-openai-usage-");
  const body =
    'data: {"choices":[{"delta":{"content":"OK"}}],"usage":null}\n\ndata: {"choices":[],"usage":{"prompt_tokens":100,"completion_tokens":10,"prompt_tokens_details":{"cached_tokens":80},"completion_tokens_details":{"reasoning_tokens":8}}}\n\ndata: [DONE]\n\n';
  await using http = createLoopbackServer(function (incoming) {
    expect(incoming.headers.get("authorization")).toBe(
      "Bearer synthetic-secret-key-93",
    );
    return new Response(body);
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(
    http.url,
    options,
    {
      provider: Protocol.ProviderEnum.XIAOMI,
      messageFormat: Protocol.MessageFormatEnum.OPENAI_CHAT,
      model: Protocol.ModelEnum.MIMO_V2_6_PRO,
      url: `${http.url}/v1/chat/completions`,
      authHeader: "authorization",
    },
    { price: { input: 2, output: 10, inputTokens: 100, cacheRead: 0.1 } },
  );
  const result = await record(input.path, input.run, options);
  expect(result.usage?.completion_tokens_details).toEqual({
    reasoning_tokens: 8,
  });
  expect(result.costUsd).toBeCloseTo(
    (20 * 2 + 80 * 0.1 + 10 * 10) / 1_000_000,
    8,
  );
  expect(readFileSync(join(dirname(input.path), "response.body"), "utf8")).toBe(
    body,
  );
});

it("costs disjoint Anthropic cached input and output counts", async function () {
  using dir = createTempDir("capture-anthropic-cache-");
  const usage = {
    input_tokens: 3,
    cache_read_input_tokens: 10,
    cache_creation_input_tokens: 12,
    cache_creation: {
      ephemeral_5m_input_tokens: 5,
      ephemeral_1h_input_tokens: 7,
    },
    output_tokens: 4,
  };
  await using http = createLoopbackServer(function () {
    return Response.json({ usage });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(
    http.url,
    options,
    {},
    {
      price: {
        input: 2,
        output: 10,
        inputTokens: 100,
        cacheRead: 0.1,
        cacheWrite5m: 2.5,
        cacheWrite1h: 4,
      },
    },
  );
  const result = await record(input.path, input.run, options);
  expect(result.usage).toEqual(usage);
  expect(result.costUsd).toBeCloseTo(
    (3 * 2 + 10 * 0.1 + 5 * 2.5 + 7 * 4 + 4 * 10) / 1_000_000,
    8,
  );
});

it("prices reported input and output while keeping a reservation for missing usage", function () {
  const request = {
    ...createCaptureRequest("http://127.0.0.1:3210"),
    ...createRecordInput(),
  };
  expect(costOf({ input_tokens: 5, output_tokens: 7 }, request)).toBe(
    (5 * 2 + 7 * 10) / 1_000_000,
  );
  expect(costOf(null, request)).toBeGreaterThan(0);
});
