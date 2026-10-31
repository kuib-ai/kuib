import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import Protocol from "@kuib-ai/protocol";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import record from "../record.exchange/index.ts";
import audit from "../audit.fixture/index.ts";

it("keeps a header-cut server rejection body and its missing-usage reservation", async function () {
  using dir = createTempDir("capture-header-rejection-");
  const rejection = "synthetic server rejection";
  await using http = createLoopbackServer(function () {
    return new Response(rejection, { status: 503 });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(
    http.url,
    options,
    {},
    { cut: "headers" },
  );
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("complete");
  expect(result.status).toBe(503);
  expect(result.costUsd).toBeGreaterThan(0);
  expect(readFileSync(join(dirname(input.path), "response.body"), "utf8")).toBe(
    rejection,
  );
});

it("reserves an unterminated SSE stream instead of treating its initial usage as final", async function () {
  using dir = createTempDir("capture-unterminated-");
  const prefix =
    'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":1,"output_tokens":0}}}\n\n';
  await using http = createLoopbackServer(function () {
    return new Response(prefix, {
      headers: { "content-type": "text/event-stream" },
    });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("incomplete");
  expect(result.usage).toBeNull();
  expect(result.costUsd).toBeGreaterThan(0);
  expect(readFileSync(join(dirname(input.path), "response.body"), "utf8")).toBe(
    prefix,
  );
});

it("cuts at a thinking delta and retains every byte of the observed reader chunk", async function () {
  using dir = createTempDir("capture-thinking-cut-");
  const prefix =
    'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"partial 雪"}}\n\n';
  await using http = createLoopbackServer(function () {
    return new Response(
      new ReadableStream({
        start: function (controller) {
          controller.enqueue(new TextEncoder().encode(prefix));
        },
        cancel: function () {},
      }),
      { headers: { "content-type": "text/event-stream" } },
    );
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(
    http.url,
    options,
    {},
    { cut: "thinking" },
  );
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("cancelled");
  expect(result.usage).toBeNull();
  expect(readFileSync(join(dirname(input.path), "response.body"), "utf8")).toBe(
    prefix,
  );
  expect(
    JSON.parse(
      readFileSync(join(dirname(input.path), "transport.json"), "utf8"),
    ).cut,
  ).toBe("thinking");
  expect(result.costUsd).toBeGreaterThan(0);
});

for (const field of ["reasoning_content", "content"]) {
  it(`cuts Meta thinking at the first ${field} delta without changing observed bytes`, async function () {
    using dir = createTempDir("capture-meta-cut-");
    const prefix = `data: ${JSON.stringify({ choices: [{ delta: { [field]: "partial 雪" } }] })}\n\n`;
    await using http = createLoopbackServer(function () {
      return new Response(
        new ReadableStream({
          start: function (controller) {
            controller.enqueue(new TextEncoder().encode(prefix));
          },
          cancel: function () {},
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    });
    const options = createCaptureOptions(dir.path, http.url);
    const input = prepareCaptureTestCase(
      http.url,
      options,
      {
        provider: Protocol.ProviderEnum.META,
        messageFormat: Protocol.MessageFormatEnum.OPENAI_CHAT,
        model: Protocol.ModelEnum.MUSE_SPARK_1_1,
        url: `${http.url}/v1/chat/completions`,
      },
      { cut: "thinking" },
    );
    const result = await record(input.path, input.run, options);
    expect(result.state).toBe("cancelled");
    expect(result.usage).toBeNull();
    expect(
      readFileSync(join(dirname(input.path), "response.body"), "utf8"),
    ).toBe(prefix);
    expect(result.costUsd).toBeGreaterThan(0);
  });
}

it("cuts chat text and preserves split UTF-8 bytes with missing final usage", async function () {
  using dir = createTempDir("capture-chat-cut-");
  const prefix = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"content":"partial 雪"}}]}\n\n',
  );
  const split =
    prefix.findIndex(function (byte) {
      return byte === 233;
    }) + 1;
  await using http = createLoopbackServer(function () {
    return new Response(
      new ReadableStream({
        start: function (controller) {
          controller.enqueue(prefix.slice(0, split));
          controller.enqueue(prefix.slice(split));
        },
        cancel: function () {},
      }),
    );
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
    },
    { cut: "text" },
  );
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("cancelled");
  expect(readFileSync(join(dirname(input.path), "response.body"))).toEqual(
    Buffer.from(prefix),
  );
});

it("refuses redirects without following them or persisting an identifying Location header", async function () {
  using dir = createTempDir("capture-redirect-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1:1/?account=private" },
    });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  await expect(record(input.path, input.run, options)).rejects.toThrow(
    "redirect-refused",
  );
  expect(calls).toBe(1);
  expect(existsSync(join(dirname(input.path), "response.json"))).toBe(false);
  expect(readFileSync(options.ledger, "utf8")).not.toContain("private");
});

it("retains a real HTTP prefix and its full reservation when the body times out", async function () {
  using dir = createTempDir("capture-prefix-timeout-");
  const prefix =
    'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":1,"output_tokens":0}}}\n\n';
  await using http = createLoopbackServer(function () {
    return new Response(
      new ReadableStream({
        start: function (controller) {
          controller.enqueue(new TextEncoder().encode(prefix));
        },
        cancel: function () {},
      }),
    );
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    timeoutMs: 50,
  };
  const input = prepareCaptureTestCase(http.url, options);
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("read-failed");
  expect(result.usage).toBeNull();
  expect(result.costUsd).toBeGreaterThan(0);
  expect(readFileSync(join(dirname(input.path), "response.body"), "utf8")).toBe(
    prefix,
  );
  expect(
    JSON.parse(readFileSync(join(dirname(input.path), "response.json"), "utf8"))
      .status,
  ).toBe(200);
});

it("records a refused loopback connection with no invented HTTP status and no retry", async function () {
  using dir = createTempDir("capture-connection-refused-");
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const origin = `http://127.0.0.1:${listener.addr.port}`;
  listener.close();
  const options = createCaptureOptions(dir.path, origin);
  const input = prepareCaptureTestCase(origin, options);
  const result = await record(input.path, input.run, options);
  expect(result.state).toBe("fetch-failed");
  expect(result.status).toBeNull();
  expect(result.costUsd).toBeGreaterThan(0);
  expect(readFileSync(join(dirname(input.path), "response.body")).length).toBe(
    0,
  );
  expect(readFileSync(options.ledger, "utf8").trim().split("\n")).toHaveLength(
    2,
  );
});

it("preserves arbitrary binary bytes without decoding or newline changes", async function () {
  using dir = createTempDir("capture-binary-");
  const bytes = new Uint8Array([0, 255, 13, 10, 195, 169, 0, 254]);
  await using http = createLoopbackServer(function () {
    return new Response(bytes);
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  await record(input.path, input.run, options);
  expect(readFileSync(join(dirname(input.path), "response.body"))).toEqual(
    Buffer.from(bytes),
  );
});

it("injects each supported credential header without persisting its value", async function () {
  using dir = createTempDir("capture-auth-headers-");
  let expectedHeader = "";
  await using http = createLoopbackServer(function (incoming) {
    expect(incoming.headers.get(expectedHeader)).toBe(
      expectedHeader === "authorization"
        ? "Bearer synthetic-secret-key-93"
        : "synthetic-secret-key-93",
    );
    return new Response("OK");
  });
  const options = createCaptureOptions(dir.path, http.url);
  for (const header of ["x-api-key", "authorization", "api-key"]) {
    expectedHeader = header;
    const xiaomi = header === "api-key";
    const input = prepareCaptureTestCase(
      http.url,
      options,
      {
        provider: xiaomi
          ? Protocol.ProviderEnum.XIAOMI
          : Protocol.ProviderEnum.ANTHROPIC,
        messageFormat: Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
        model: xiaomi
          ? Protocol.ModelEnum.MIMO_V2_6_PRO
          : Protocol.ModelEnum.CLAUDE_SONNET_5_5,
        name: `header-${header}`,
        url: `${http.url}${xiaomi ? "/anthropic/v1/messages" : "/v1/messages"}`,
        authHeader: header,
      },
      { row: `synthetic/header-${header}` },
    );
    await record(input.path, input.run, options);
  }
  expect(audit(options.root, [options.key]).files).toBe(18);
});
