import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureRequest from "../create.capture.request/index.ts";
import createCaptureOptions from "../create.capture.options/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import prepare from "../prepare.request/index.ts";
import sequence from "./index.ts";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import Protocol from "@kuib-ai/protocol";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import listCaptureFiles from "../list.capture.files/index.ts";
import record from "../record.exchange/index.ts";

it("stops after two consecutive loopback 429 answers", async function () {
  using dir = createTempDir("capture-sequence-");
  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0, onListen: function () {} },
    function () {
      return new Response("throttled", { status: 429 });
    },
  );
  await using _serving = {
    async [Symbol.asyncDispose]() {
      await server.shutdown();
    },
  };
  const origin = `http://127.0.0.1:${server.addr.port}`;
  const options = createCaptureOptions(dir.path, origin);
  const first = prepare(createCaptureRequest(origin), options);
  const second = prepare(
    createCaptureRequest(origin, { name: "second" }),
    options,
  );
  const result = await sequence(
    [
      { path: first, run: createRecordInput() },
      { path: second, run: createRecordInput({ row: "synthetic/second" }) },
    ],
    { ...options, keys: { anthropic: options.key } },
  );
  expect(result.results).toHaveLength(2);
  expect(result.stop).toBe("consecutive-transient-failures");
});

for (const status of [429, 500, 503, 599]) {
  it(`ends a sequence after two ${status} answers without retry or a permanent provider stop`, async function () {
    using dir = createTempDir("capture-transient-");
    let calls = 0;
    await using http = createLoopbackServer(function () {
      calls++;
      return calls <= 2
        ? Response.json(
            {
              error: {
                type: status === 429 ? "rate_limit_error" : "api_error",
                message: "synthetic temporary failure",
              },
            },
            { status },
          )
        : new Response("OK");
    });
    const options = {
      ...createCaptureOptions(dir.path, http.url),
      limits: { anthropic: 3 },
    };
    const entries = ["first", "second", "third", "fourth"].map(function (name) {
      return prepareCaptureTestCase(
        http.url,
        options,
        { name },
        { row: `synthetic/${name}` },
      );
    });
    const run = await sequence(entries.slice(0, 3), {
      ...options,
      keys: { anthropic: options.key },
    });
    expect(
      run.results.map(function (result) {
        return result.status;
      }),
    ).toEqual([status, status]);
    expect(run.stop).toBe("consecutive-transient-failures");
    expect(calls).toBe(2);
    expect(existsSync(join(dirname(entries[2]!.path), "response.json"))).toBe(
      false,
    );
    const ledger = readFileSync(options.ledger, "utf8")
      .trim()
      .split("\n")
      .map(function (line) {
        return JSON.parse(line);
      });
    expect(ledger).toHaveLength(4);
    expect(
      ledger.every(function (entry) {
        return entry.stop === null;
      }),
    ).toBe(true);
    await expect(
      record(entries[0]!.path, entries[0]!.run, options),
    ).rejects.toThrow("capture-exists");
    const resumed = await sequence([entries[2]!], {
      ...options,
      keys: { anthropic: options.key },
    });
    expect(resumed.results[0]!.status).toBe(200);
    expect(resumed.stop).toBeNull();
    await expect(
      record(entries[3]!.path, entries[3]!.run, options),
    ).rejects.toThrow("provider-count-limit");
    expect(calls).toBe(3);
  });
}

it("ends a sequence after two refused loopback connections while retaining their reservations and counts", async function () {
  using dir = createTempDir("capture-connection-sequence-");
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const origin = `http://127.0.0.1:${listener.addr.port}`;
  listener.close();
  const options = {
    ...createCaptureOptions(dir.path, origin),
    limits: { anthropic: 3 },
  };
  const entries = ["first", "second", "third"].map(function (name) {
    return prepareCaptureTestCase(
      origin,
      options,
      { name },
      { row: `synthetic/${name}` },
    );
  });
  const run = await sequence(entries, {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(
    run.results.map(function (result) {
      return result.state;
    }),
  ).toEqual(["fetch-failed", "fetch-failed"]);
  expect(
    run.results.every(function (result) {
      return result.costUsd > 0 && result.stop === null;
    }),
  ).toBe(true);
  expect(run.stop).toBe("consecutive-transient-failures");
  expect(readFileSync(options.ledger, "utf8").trim().split("\n")).toHaveLength(
    4,
  );
  expect(existsSync(join(dirname(entries[2]!.path), "response.json"))).toBe(
    false,
  );
  await expect(
    record(entries[0]!.path, entries[0]!.run, options),
  ).rejects.toThrow("capture-exists");
  await using http = createLoopbackServer(function () {
    return new Response("OK");
  });
  const recoveredOptions = { ...options, origins: [http.url] };
  const recovered = prepareCaptureTestCase(
    http.url,
    recoveredOptions,
    { name: "recovered" },
    { row: "synthetic/recovered" },
  );
  expect(
    (await record(recovered.path, recovered.run, recoveredOptions)).status,
  ).toBe(200);
  await expect(
    record(entries[2]!.path, entries[2]!.run, options),
  ).rejects.toThrow("provider-count-limit");
});

it("counts mixed fetch failures and 429 answers as consecutive transient failures", async function () {
  using dir = createTempDir("capture-mixed-transient-");
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const origin = `http://127.0.0.1:${listener.addr.port}`;
  listener.close();
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return new Response(calls === 1 ? "synthetic temporary rate limit" : "OK", {
      status: calls === 1 ? 429 : 200,
    });
  });
  const options = {
    ...createCaptureOptions(dir.path, origin),
    origins: [origin, http.url],
  };
  const entries = [
    prepareCaptureTestCase(
      origin,
      options,
      { name: "connection" },
      { row: "synthetic/connection" },
    ),
    prepareCaptureTestCase(
      http.url,
      options,
      { name: "rate" },
      { row: "synthetic/rate" },
    ),
    prepareCaptureTestCase(
      http.url,
      options,
      { name: "answer" },
      { row: "synthetic/answer" },
    ),
  ];
  const run = await sequence(entries, {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(run.results).toHaveLength(2);
  expect(run.stop).toBe("consecutive-transient-failures");
  expect(calls).toBe(1);
  expect(
    (await record(entries[2]!.path, entries[2]!.run, options)).status,
  ).toBe(200);
  expect(calls).toBe(2);
});

it("resets the transient streak on any non-transient answer and starts fresh on a later run", async function () {
  using dir = createTempDir("capture-transient-reset-");
  const statuses = [503, 400, 500, 200, 429, 503, 200];
  let calls = 0;
  await using http = createLoopbackServer(function () {
    return new Response("synthetic answer", { status: statuses[calls++]! });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const entries = statuses.map(function (_status, index) {
    return prepareCaptureTestCase(
      http.url,
      options,
      { name: `row-${index}` },
      { row: `synthetic/row-${index}` },
    );
  });
  const run = await sequence(entries, {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(
    run.results.map(function (result) {
      return result.status;
    }),
  ).toEqual(statuses.slice(0, 6));
  expect(run.stop).toBe("consecutive-transient-failures");
  expect(calls).toBe(6);
  const later = await sequence([entries[6]!], {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(later.results[0]!.status).toBe(200);
  expect(later.stop).toBeNull();
  expect(calls).toBe(7);
});

it("scans all supplied sequence credentials when another provider key is reflected", async function () {
  using dir = createTempDir("capture-sequence-keys-");
  const otherKey = "synthetic-other-provider-key-17";
  await using http = createLoopbackServer(function () {
    return new Response(otherKey);
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  await expect(
    sequence([input], {
      ...options,
      keys: {
        [Protocol.ProviderEnum.ANTHROPIC]: options.key,
        [Protocol.ProviderEnum.XIAOMI]: otherKey,
      },
    }),
  ).rejects.toThrow("sensitive-data");
  expect(existsSync(join(dirname(input.path), "response.body"))).toBe(false);
  for (const file of listCaptureFiles(dir.path))
    expect(readFileSync(file).includes(otherKey)).toBe(false);
});

it("runs requests sequentially and reserves missing usage across invocations", async function () {
  using dir = createTempDir("capture-ordered-sequence-");
  const seen: string[] = [];
  let active = false;
  await using http = createLoopbackServer(async function (incoming) {
    expect(active).toBe(false);
    active = true;
    seen.push(await incoming.text());
    active = false;
    return new Response("OK");
  });
  const options = {
    ...createCaptureOptions(dir.path, http.url),
    limits: { anthropic: 2 },
  };
  const entries = ["first", "second", "third"].map(function (name) {
    return prepareCaptureTestCase(
      http.url,
      options,
      { name },
      { row: `synthetic/${name}` },
    );
  });
  const run = await sequence(entries.slice(0, 2), {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(run.results).toHaveLength(2);
  expect(
    run.results.every(function (result) {
      return result.usage === null && result.costUsd > 0;
    }),
  ).toBe(true);
  await expect(
    record(entries[2]!.path, entries[2]!.run, options),
  ).rejects.toThrow("provider-count-limit");
  expect(seen).toHaveLength(2);
  expect(readFileSync(options.ledger, "utf8").trim().split("\n")).toHaveLength(
    4,
  );
});

for (const status of [401, 402, 403, 429]) {
  it(`stops on ${status} authentication/billing failures and keeps the safe rejection fixture`, async function () {
    using dir = createTempDir("capture-sequence-stop-");
    let calls = 0;
    await using http = createLoopbackServer(function () {
      calls++;
      return Response.json(
        {
          error: {
            type:
              status === 429
                ? "rate_limit_error"
                : status === 402
                  ? "billing_error"
                  : "authentication_error",
            message:
              status === 429
                ? "synthetic spend cap reached"
                : "synthetic rejection",
          },
        },
        { status },
      );
    });
    const options = createCaptureOptions(dir.path, http.url);
    const entries = ["first", "second"].map(function (name) {
      return prepareCaptureTestCase(
        http.url,
        options,
        { name },
        { row: `synthetic/${name}` },
      );
    });
    const run = await sequence(entries, {
      ...options,
      keys: { anthropic: options.key },
    });
    expect(run.results).toHaveLength(1);
    expect(run.results[0]!.stop).not.toBeNull();
    await expect(
      record(entries[1]!.path, entries[1]!.run, options),
    ).rejects.toThrow("provider-stopped");
    expect(calls).toBe(1);
    expect(
      JSON.parse(
        readFileSync(join(dirname(entries[0]!.path), "response.json"), "utf8"),
      ).status,
    ).toBe(status);
  });
}

it("keeps an unexpected rejection without retry and continues independent rows", async function () {
  using dir = createTempDir("capture-sequence-rejection-");
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return Response.json(
      {
        error: {
          type: "invalid_request_error",
          message: "synthetic unsupported value",
        },
      },
      { status: 400 },
    );
  });
  const options = createCaptureOptions(dir.path, http.url);
  const entries = ["first", "second"].map(function (name) {
    return prepareCaptureTestCase(
      http.url,
      options,
      { name },
      { row: `synthetic/${name}` },
    );
  });
  const run = await sequence(entries, {
    ...options,
    keys: { anthropic: options.key },
  });
  expect(run.results).toHaveLength(2);
  expect(calls).toBe(2);
});
