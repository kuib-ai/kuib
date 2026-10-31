import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import Protocol from "@kuib-ai/protocol";
import fixturePath from "@kuib-ai/inference/fixture.path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import readPrepared from "../read.prepared.request/index.ts";
import record from "../record.exchange/index.ts";
import createCaptureRequest from "../create.capture.request/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import allowance from "./index.ts";
import sequence from "../sequence.requests/index.ts";

it("marks the two named MiMo admission repeats and prevents another start of their rows", async function () {
  using dir = createTempDir("capture-admission-");
  await using http = createLoopbackServer(function () {
    return Response.json({ usage: { prompt_tokens: 1, completion_tokens: 1 } });
  });
  const options = createCaptureOptions(dir.path, http.url);
  for (const format of ["MA", "MO"] as const) {
    const source = `${format}/host-sgp`;
    const requestChanges = {
      provider: Protocol.ProviderEnum.XIAOMI,
      messageFormat:
        format === "MA"
          ? Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES
          : Protocol.MessageFormatEnum.OPENAI_CHAT,
      model: Protocol.ModelEnum.MIMO_V2_6_PRO,
      name: "host-sgp-repeat",
      url: `${http.url}${format === "MA" ? "/anthropic/v1/messages" : "/v1/chat/completions"}`,
      body: JSON.stringify({
        model: "mimo-v2.6-pro",
        max_tokens: 32,
        messages: [],
      }),
    };
    const runChanges = { row: `${source}-repeat`, admissionRepeatOf: source };
    const first = prepareCaptureTestCase(
      http.url,
      options,
      requestChanges,
      runChanges,
    );
    expect((await record(first.path, first.run, options)).status).toBe(200);
    const other = prepareCaptureTestCase(
      http.url,
      options,
      { ...requestChanges, name: "other" },
      runChanges,
    );
    await expect(record(other.path, other.run, options)).rejects.toThrow(
      "already-started",
    );
    expect(function () {
      readPrepared(
        other.path,
        { ...other.run, admissionRepeatOf: `${format}/host-api` },
        options,
      );
    }).toThrow("invalid-admission-repeat");
  }
  const entries = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(
    entries.map(function (entry) {
      return entry.admissionRepeatOf;
    }),
  ).toEqual(["MA/host-sgp", "MA/host-sgp", "MO/host-sgp", "MO/host-sgp"]);
});

it("marks a signed repeat in the run ledger and prevents another start of its row", async function () {
  using dir = createTempDir("capture-signed-repeat-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return Response.json({ usage: { input_tokens: 12, output_tokens: 4 } });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const body = JSON.stringify({
    model: "claude-sonnet-5-5",
    max_tokens: 32,
    messages: [],
  });
  const runChanges = {
    row: "S/tool-replay-no-signature-signed",
    signedRepeatOf: "S/tool-replay-no-signature",
  };
  const first = prepareCaptureTestCase(
    http.url,
    options,
    { name: "tool-replay-no-signature-signed", body },
    runChanges,
  );
  expect((await record(first.path, first.run, options)).status).toBe(200);
  const envelope = JSON.parse(readFileSync(first.path, "utf8"));
  expect(envelope.signedRepeatOf).toBeUndefined();
  const entries = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(
    entries.map(function (entry) {
      return entry.signedRepeatOf;
    }),
  ).toEqual([runChanges.signedRepeatOf, runChanges.signedRepeatOf]);
  const other = prepareCaptureTestCase(
    http.url,
    options,
    { name: "another-case", body },
    runChanges,
  );
  await expect(record(other.path, other.run, options)).rejects.toThrow(
    "already-started",
  );
  expect(calls).toBe(1);
  for (const changes of [
    { signedRepeatOf: "L/tool-replay" },
    { row: "S/tool-replay-no-signature-signed-again" },
    { signedRepeatOf: "S/plain-json" },
    { diagnosticRepeatOf: 1 },
  ])
    expect(function () {
      readPrepared(other.path, { ...other.run, ...changes }, options);
    }).toThrow("invalid-signed-repeat");
});

it("admits the named JSON max repeat and only one matching native source for each outside-thinking repeat", async function () {
  using dir = createTempDir("capture-outside-repeat-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return Response.json({ usage: { input_tokens: 1, output_tokens: 1 } });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const body = JSON.stringify({
    model: "claude-sonnet-5-5",
    max_tokens: 32,
    messages: [],
  });
  const json = prepareCaptureTestCase(
    http.url,
    options,
    { name: "reasoning-json-signed-max", body },
    { row: "S/reasoning-json-signed-max", signedRepeatOf: "S/reasoning-json" },
  );
  expect((await record(json.path, json.run, options)).status).toBe(200);
  for (const operation of ["omit", "keep"] as const) {
    const source = `S/reasoning-outside-${operation}`;
    const replay = {
      fixture: fixturePath(
        Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
        Protocol.ProviderEnum.ANTHROPIC,
        Protocol.ModelEnum.CLAUDE_SONNET_5_5,
        "reasoning-stream-signed",
      ),
      changes: [operation],
    };
    const runChanges = {
      row: `${source}-signed-stream`,
      signedRepeatOf: source,
    };
    const input = prepareCaptureTestCase(
      http.url,
      options,
      { name: `reasoning-outside-${operation}-signed-stream`, body, replay },
      runChanges,
    );
    expect(function () {
      readPrepared(input.path, input.run, options);
    }).not.toThrow();
    const wrong = prepareCaptureTestCase(
      http.url,
      options,
      {
        name: `reasoning-outside-${operation}-wrong`,
        body,
        replay: {
          ...replay,
          fixture: fixturePath(
            Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
            Protocol.ProviderEnum.ANTHROPIC,
            Protocol.ModelEnum.CLAUDE_SONNET_5_5,
            "reasoning-json-signed",
          ),
        },
      },
      runChanges,
    );
    expect(function () {
      readPrepared(wrong.path, wrong.run, options);
    }).toThrow("invalid-signed-repeat");
    expect((await record(input.path, input.run, options)).status).toBe(200);
    const other = prepareCaptureTestCase(
      http.url,
      options,
      {
        name: `reasoning-outside-${operation}-signed-json-max`,
        body,
        replay: {
          ...replay,
          fixture: fixturePath(
            Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
            Protocol.ProviderEnum.ANTHROPIC,
            Protocol.ModelEnum.CLAUDE_SONNET_5_5,
            "reasoning-json-signed-max",
          ),
        },
      },
      { row: `${source}-signed-json-max`, signedRepeatOf: source },
    );
    await expect(record(other.path, other.run, options)).rejects.toThrow(
      "signed-already-started",
    );
  }
  expect(calls).toBe(3);
});

it("reads a named ceiling rejection in full and refunds it without changing an earlier header-cut reservation", async function () {
  using dir = createTempDir("capture-ceiling-repeat-");
  let calls = 0;
  const rejection =
    '{"error":{"type":"invalid_request_error","message":"synthetic ceiling rejection"}}';
  await using http = createLoopbackServer(function () {
    calls++;
    return calls === 1
      ? new Response("unused answer")
      : new Response(rejection, { status: 400 });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const body = JSON.stringify({
    model: "claude-sonnet-5-5",
    max_tokens: 128001,
    messages: [],
  });
  const original = prepareCaptureTestCase(
    http.url,
    options,
    { body },
    { row: "S/output-above-ceiling", cut: "headers" },
  );
  const first = await record(original.path, original.run, options);
  expect(first.state).toBe("cancelled");
  const history = readFileSync(options.ledger, "utf8");
  const repeat = prepareCaptureTestCase(
    http.url,
    options,
    { name: "output-above-ceiling-repeat", body },
    {
      row: "S/output-above-ceiling-repeat",
      ceilingRepeatOf: "S/output-above-ceiling",
      cut: "headers",
    },
  );
  const result = await record(repeat.path, repeat.run, options);
  expect(result.status).toBe(400);
  expect(result.state).toBe("complete");
  expect(result.costUsd).toBe(0);
  expect(
    readFileSync(join(dirname(repeat.path), "response.body"), "utf8"),
  ).toBe(rejection);
  const ledgerText = readFileSync(options.ledger, "utf8");
  expect(ledgerText.startsWith(history)).toBe(true);
  const entries = ledgerText
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(entries[1].costUsd).toBe(first.costUsd);
  expect(
    entries.slice(2).map(function (entry) {
      return entry.ceilingRepeatOf;
    }),
  ).toEqual(["S/output-above-ceiling", "S/output-above-ceiling"]);
  const other = prepareCaptureTestCase(
    http.url,
    options,
    { name: "another-ceiling-case", body },
    { ...repeat.run },
  );
  await expect(record(other.path, other.run, options)).rejects.toThrow(
    "already-started",
  );
  expect(calls).toBe(2);
  expect(function () {
    readPrepared(
      other.path,
      { ...other.run, row: "S/output-above-ceiling-repeat-again" },
      options,
    );
  }).toThrow("invalid-ceiling-repeat");
  const low = prepareCaptureTestCase(
    http.url,
    options,
    {
      name: "invalid-limit",
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 32,
        messages: [],
      }),
    },
    { ...repeat.run },
  );
  expect(function () {
    readPrepared(low.path, low.run, options);
  }).toThrow("invalid-ceiling-repeat");
  expect(function () {
    readPrepared(
      other.path,
      { ...other.run, ceilingRepeatOf: "MO/output-above-ceiling" },
      options,
    );
  }).toThrow("output-limit");
});

it("enforces the budget before the first provider call", function () {
  using dir = createTempDir("capture-allowance-");
  const origin = "http://127.0.0.1:3210";
  const request = { ...createCaptureRequest(origin), ...createRecordInput() };
  const options = { ...createCaptureOptions(dir.path, origin), budgetUsd: 0 };
  expect(function () {
    allowance(request, options);
  }).toThrow("capture-budget-limit");
});

it("releases complete 4xx reservations without usage so rejected rows do not consume the dollar budget", async function () {
  using dir = createTempDir("capture-rejected-budget-");
  const statuses = [400, 404, 422, 429, 499];
  let calls = 0;
  await using http = createLoopbackServer(function () {
    return Response.json(
      {
        error: {
          type: "invalid_request_error",
          message: "synthetic rejection",
        },
      },
      { status: statuses[calls++]! },
    );
  });
  const options = { ...createCaptureOptions(dir.path, http.url), budgetUsd: 5 };
  const entries = statuses.map(function (_status, index) {
    return prepareCaptureTestCase(
      http.url,
      options,
      { name: `reject-${index}` },
      {
        row: `synthetic/reject-${index}`,
        price: { input: 0, output: 93_750, inputTokens: 0 },
      },
    );
  });
  const run = await sequence(entries, {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(run.stop).toBeNull();
  expect(run.results).toHaveLength(statuses.length);
  expect(
    run.results.every(function (result) {
      return (
        result.state === "complete" &&
        result.usage === null &&
        result.costUsd === 0
      );
    }),
  ).toBe(true);
  const ledger = readFileSync(options.ledger, "utf8")
    .trim()
    .split("\n")
    .map(function (line) {
      return JSON.parse(line);
    });
  expect(
    ledger
      .filter(function (entry) {
        return entry.kind === "started";
      })
      .every(function (entry) {
        return entry.costUsd === 3;
      }),
  ).toBe(true);
  expect(
    ledger
      .filter(function (entry) {
        return entry.kind === "finished";
      })
      .every(function (entry) {
        return entry.costUsd === 0;
      }),
  ).toBe(true);
  expect(calls).toBe(statuses.length);
});

it("enforces the five-dollar ceiling even if the caller supplies a larger budget", async function () {
  using dir = createTempDir("capture-five-dollar-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response("OK");
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    budgetUsd: 100,
  };
  const first = prepareCaptureTestCase(
    http.url,
    options,
    {},
    { price: { input: 0, output: 93_750, inputTokens: 0 } },
  );
  const second = prepareCaptureTestCase(
    http.url,
    options,
    { name: "second" },
    { row: "synthetic/second", price: first.run.price },
  );
  await record(first.path, first.run, options);
  await expect(record(second.path, second.run, options)).rejects.toThrow(
    "capture-budget-limit",
  );
  expect(calls).toBe(1);
});

it("limits a historical authentication stop to its host, path and header without rewriting history", async function () {
  using dir = createTempDir("capture-auth-scope-");
  let calls = 0;
  await using http = createLoopbackServer(function (incoming) {
    calls++;
    if (
      new URL(incoming.url).pathname === "/anthropic/v1/messages" &&
      incoming.headers.has("api-key")
    )
      return Response.json(
        { error: { type: "authentication_error" } },
        { status: 401 },
      );
    return new Response("OK");
  });
  await using other = createLoopbackServer(function () {
    calls++;
    return new Response("OK");
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    origins: [http.url, other.url],
  };
  const base = {
    provider: Protocol.ProviderEnum.XIAOMI,
    messageFormat: Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
    model: Protocol.ModelEnum.MIMO_V2_6_PRO,
    url: `${http.url}/anthropic/v1/messages`,
    authHeader: "api-key",
    body: JSON.stringify({
      model: "mimo-v2.6-pro",
      max_tokens: 32,
      messages: [],
    }),
  };
  const first = prepareCaptureTestCase(http.url, options, base);
  expect((await record(first.path, first.run, options)).stop).toBe(
    "authentication-failure",
  );
  const history =
    readFileSync(options.ledger, "utf8")
      .trim()
      .split("\n")
      .map(function (line) {
        const entry = JSON.parse(line);
        delete entry.authHeader;
        return JSON.stringify(entry);
      })
      .join("\n") + "\n";
  writeFileSync(options.ledger, history);
  const same = prepareCaptureTestCase(
    http.url,
    options,
    { ...base, name: "same-combination" },
    { row: "synthetic/same" },
  );
  await expect(record(same.path, same.run, options)).rejects.toThrow(
    "provider-stopped",
  );
  const choices = [
    { name: "other-header", authHeader: "authorization" },
    { name: "other-path", url: `${http.url}/v1/chat/completions` },
    { name: "other-host", url: `${other.url}/anthropic/v1/messages` },
  ];
  for (const changes of choices) {
    const input = prepareCaptureTestCase(
      http.url,
      options,
      { ...base, ...changes },
      { row: `synthetic/${changes.name}` },
    );
    expect((await record(input.path, input.run, options)).status).toBe(200);
  }
  expect(calls).toBe(4);
  expect(readFileSync(options.ledger, "utf8").startsWith(history)).toBe(true);
});

it("keeps billing stops provider-wide across different hosts, paths and headers", async function () {
  using dir = createTempDir("capture-billing-scope-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return Response.json({ error: { type: "billing_error" } }, { status: 402 });
  });
  await using other = createLoopbackServer(function () {
    calls++;
    return new Response("OK");
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    origins: [http.url, other.url],
  };
  const base = {
    provider: Protocol.ProviderEnum.XIAOMI,
    messageFormat: Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
    model: Protocol.ModelEnum.MIMO_V2_6_PRO,
    url: `${http.url}/anthropic/v1/messages`,
    authHeader: "api-key",
    body: JSON.stringify({
      model: "mimo-v2.6-pro",
      max_tokens: 32,
      messages: [],
    }),
  };
  const first = prepareCaptureTestCase(http.url, options, base);
  expect((await record(first.path, first.run, options)).stop).toBe(
    "billing-failure",
  );
  const changed = prepareCaptureTestCase(
    http.url,
    options,
    {
      ...base,
      name: "other-combination",
      authHeader: "authorization",
      url: `${other.url}/v1/chat/completions`,
    },
    { row: "synthetic/other" },
  );
  await expect(record(changed.path, changed.run, options)).rejects.toThrow(
    "provider-stopped",
  );
  expect(calls).toBe(1);
});
