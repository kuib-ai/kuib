import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import listCaptureFiles from "../list.capture.files/index.ts";
import audit from "../audit.fixture/index.ts";
import liftStop from "../lift.stop/index.ts";
import bytesHash from "../hash.bytes/index.ts";
import record from "../record.exchange/index.ts";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";

for (const alphabet of ["base64", "base64url"] as const) {
  for (const alignment of [0, 1, 2]) {
    it(`refuses ${alphabet} secrets at byte alignment ${alignment} in a real response and an audit`, async function () {
      using dir = createTempDir("capture-secret-");
      const key = "synthetic-secret-key-93";
      const encoded = Buffer.concat([
        Buffer.from([251, 255, 255, 251, 255, 255]),
        Buffer.alloc(alignment, 171),
        Buffer.from(key),
        Buffer.from("private-suffix"),
      ]).toString(alphabet);
      await using http = createLoopbackServer(function () {
        return Response.json({ signature: encoded });
      });
      const options = createCaptureOptions(dir.path, http.url);
      const { path, run } = prepareCaptureTestCase(http.url, options);
      await expect(record(path, run, options)).rejects.toThrow(
        "sensitive-data",
      );
      const entries = readFileSync(options.ledger, "utf8")
        .trim()
        .split("\n")
        .map(function (line) {
          return JSON.parse(line);
        });
      expect(entries.at(-1).diagnosis).toEqual({
        kind: "call-key",
        length: key.length,
        form: "base64",
        blob: "response-body",
      });
      expect(existsSync(join(dirname(path), "response.body"))).toBe(false);
      for (const file of listCaptureFiles(dir.path)) {
        const bytes = readFileSync(file);
        expect(bytes.includes(key)).toBe(false);
        expect(bytes.includes(encoded)).toBe(false);
      }
      writeFileSync(
        join(dirname(path), "response.body"),
        JSON.stringify({ signature: encoded }),
      );
      expect(function () {
        audit(options.root, [key]);
      }).toThrow("sensitive-data");
    });
  }
}

for (const form of [
  "raw",
  "json-escaped",
  "url-encoded",
  "base64",
  "unicode-escaped",
] as const) {
  it(`diagnoses ${form} call-key reflections without retaining the value or surrounding text`, async function () {
    using dir = createTempDir("capture-reflection-");
    const key = 'synthetic-"private"\\key+$93';
    const forms = {
      raw: key,
      "json-escaped": JSON.stringify(key).slice(1, -1),
      "url-encoded": encodeURIComponent(key),
      base64: Buffer.from(key).toString("base64"),
      "unicode-escaped": [...key]
        .map(function (letter) {
          return `\\u${letter.charCodeAt(0).toString(16).padStart(4, "0")}`;
        })
        .join(""),
    };
    const surrounding = "private-response-surrounding-text-93";
    await using http = createLoopbackServer(function () {
      return new Response(`${surrounding}:${forms[form]}`);
    });
    const options = { ...createCaptureOptions(dir.path, http.url), key };
    const { path, run } = prepareCaptureTestCase(http.url, options);
    await expect(record(path, run, options)).rejects.toThrow("sensitive-data");
    const finished = JSON.parse(
      readFileSync(options.ledger, "utf8").trim().split("\n").at(-1)!,
    );
    expect(finished.diagnosis).toEqual({
      kind: "call-key",
      length: key.length,
      form,
      blob: "response-body",
    });
    for (const file of listCaptureFiles(dir.path)) {
      const text = readFileSync(file, "utf8");
      for (const value of Object.values(forms))
        expect(text).not.toContain(value);
      expect(text).not.toContain(surrounding);
    }
    expect(existsSync(join(dirname(path), "response.body"))).toBe(false);
  });
}

it("distinguishes another provider key from a named response header value", async function () {
  for (const kind of ["other-provider-key", "response-header"] as const) {
    using dir = createTempDir("capture-other-key-");
    const value = "synthetic-other-private-value-93";
    await using http = createLoopbackServer(function () {
      return new Response(value, {
        headers: kind === "response-header" ? { "x-account-id": value } : {},
      });
    });
    const options = {
      ...createCaptureOptions(dir.path, http.url),
      secrets: kind === "other-provider-key" ? [value] : [],
    };
    const { path, run } = prepareCaptureTestCase(http.url, options);
    await expect(record(path, run, options)).rejects.toThrow("sensitive-data");
    const finished = JSON.parse(
      readFileSync(options.ledger, "utf8").trim().split("\n").at(-1)!,
    );
    expect(finished.diagnosis).toEqual({
      kind,
      ...(kind === "response-header" ? { header: "x-account-id" } : {}),
      length: value.length,
      form: "raw",
      blob: "response-body",
    });
    for (const file of listCaptureFiles(dir.path))
      expect(readFileSync(file, "utf8")).not.toContain(value);
  }
});

for (const blob of [
  "response-metadata",
  "transport-metadata",
  "ledger-entry",
] as const) {
  it(`identifies ${blob} without persisting its sensitive match`, async function () {
    using dir = createTempDir("capture-blob-");
    const value =
      blob === "response-metadata"
        ? "synthetic-secret-key-93"
        : blob === "transport-metadata"
          ? bytesHash(new TextEncoder().encode("OK"))
          : "0.007804";
    await using http = createLoopbackServer(function () {
      return new Response(
        blob === "ledger-entry"
          ? '{"usage":{"input_tokens":17,"output_tokens":777}}'
          : "OK",
        {
          headers:
            blob === "response-metadata"
              ? { "request-id": value }
              : { "x-account-id": value },
        },
      );
    });
    const options = createCaptureOptions(dir.path, http.url);
    const { path, run } = prepareCaptureTestCase(http.url, options);
    await expect(record(path, run, options)).rejects.toThrow("sensitive-data");
    const finished = JSON.parse(
      readFileSync(options.ledger, "utf8").trim().split("\n").at(-1)!,
    );
    expect(finished.diagnosis).toEqual({
      kind: blob === "response-metadata" ? "call-key" : "response-header",
      ...(blob === "response-metadata" ? {} : { header: "x-account-id" }),
      length: value.length,
      form: "raw",
      blob,
    });
    for (const file of listCaptureFiles(dir.path))
      expect(readFileSync(file, "utf8")).not.toContain(value);
    expect(existsSync(join(dirname(path), "response.json"))).toBe(false);
    expect(existsSync(join(dirname(path), "transport.json"))).toBe(false);
  });
}

for (const form of [
  "plain",
  "escaped",
  "encoded",
  "base64",
  "unicode",
  "mixed-unicode",
  "mixed-encoded",
  "header",
  "account",
]) {
  it(`refuses ${form} sensitive data reflected by a real server before any response file is written`, async function () {
    using dir = createTempDir("capture-reflected-");
    const key = "synthetic-secret+$93";
    const forms: Record<string, string> = {
      plain: key,
      escaped: JSON.stringify(key).slice(1, -1),
      encoded: encodeURIComponent(key),
      base64: Buffer.from(key).toString("base64"),
      unicode: [...key]
        .map(function (letter) {
          return `\\u${letter.charCodeAt(0).toString(16).padStart(4, "0")}`;
        })
        .join(""),
      "mixed-unicode": key.replace("secret", "\\u0073ecret"),
      "mixed-encoded": key.replace("secret", "%73ecret"),
      header: "OK",
      account: "account-private-93",
    };
    await using http = createLoopbackServer(function () {
      const reflected = forms[form]!;
      const body = new ReadableStream({
        start: function (controller) {
          controller.enqueue(new TextEncoder().encode(reflected.slice(0, 5)));
          controller.enqueue(new TextEncoder().encode(reflected.slice(5)));
          controller.close();
        },
      });
      return new Response(body, {
        headers:
          form === "header"
            ? { "request-id": key }
            : form === "account"
              ? { "x-new-account-id": reflected }
              : {},
      });
    });
    const options = { ...createCaptureOptions(dir.path, http.url), key };
    const { path, run } = prepareCaptureTestCase(http.url, options);
    await expect(record(path, run, options)).rejects.toThrow("sensitive-data");
    expect(existsSync(join(dirname(path), "response.body"))).toBe(false);
    expect(existsSync(join(dirname(path), "response.json"))).toBe(false);
    for (const file of listCaptureFiles(dir.path))
      expect(readFileSync(file).includes(key)).toBe(false);
    expect(readFileSync(options.ledger, "utf8")).toContain(
      '"stop":"sensitive-data"',
    );
    const second = prepareCaptureTestCase(http.url, options, {
      name: "after-reflection",
    });
    await expect(record(second.path, second.run, options)).rejects.toThrow(
      "provider-stopped",
    );
  });
}

for (const form of ["raw", "base64", "base64url"] as const) {
  it(`records approved organization-id ${form} body data, marks the case and requires that mark during audit`, async function () {
    using dir = createTempDir("capture-organization-");
    const organizationId = "12345678-1234-4567-89ab-123456789abc";
    const encoded =
      form === "raw"
        ? organizationId
        : Buffer.concat([
            Buffer.from([251, 255, 171, 171]),
            Buffer.from(organizationId),
            Buffer.from("suffix"),
          ]).toString(form);
    await using http = createLoopbackServer(function () {
      return Response.json(
        { signature: encoded },
        { headers: { "anthropic-organization-id": organizationId } },
      );
    });
    const options = createCaptureOptions(dir.path, http.url);
    const { path, run } = prepareCaptureTestCase(http.url, options);
    expect((await record(path, run, options)).status).toBe(200);
    const folder = dirname(path);
    const transportPath = join(folder, "transport.json");
    const transport = JSON.parse(readFileSync(transportPath, "utf8"));
    expect(transport.anthropicOrganizationId).toBe(true);
    expect(readFileSync(join(folder, "response.body"), "utf8")).toContain(
      encoded,
    );
    expect(
      JSON.parse(readFileSync(join(folder, "response.json"), "utf8")).headers,
    ).not.toHaveProperty("anthropic-organization-id");
    expect(readFileSync(options.ledger, "utf8")).not.toContain(organizationId);
    expect(audit(options.root, [options.key], [organizationId]).files).toBe(6);
    delete transport.anthropicOrganizationId;
    writeFileSync(transportPath, JSON.stringify(transport));
    expect(function () {
      audit(options.root, [options.key], [organizationId]);
    }).toThrow();
    if (form !== "raw")
      expect(function () {
        audit(options.root, [options.key]);
      }).toThrow("encoded-uuid");
  });
}

it("marks an approved id carried only in the request body and still refuses keys and other identity headers", async function () {
  using dir = createTempDir("capture-body-id-");
  const organizationId = "12345678-1234-4567-89ab-123456789abc";
  const other = "private-workspace-sentinel";
  let calls = 0;
  await using http = createLoopbackServer(function () {
    calls++;
    return Response.json(
      calls === 1
        ? { content: "OK" }
        : calls === 2
          ? { id: organizationId, key: "synthetic-secret-key-93" }
          : { id: organizationId, other },
      {
        headers: {
          "anthropic-organization-id": organizationId,
          "x-workspace-id": other,
        },
      },
    );
  });
  const options = createCaptureOptions(dir.path, http.url);
  const body = JSON.stringify({
    model: "synthetic-model",
    max_tokens: 32,
    messages: [
      {
        role: "assistant",
        content: Buffer.from(organizationId).toString("base64"),
      },
    ],
  });
  const first = prepareCaptureTestCase(http.url, options, { body });
  expect((await record(first.path, first.run, options)).status).toBe(200);
  expect(
    JSON.parse(
      readFileSync(join(dirname(first.path), "transport.json"), "utf8"),
    ).anthropicOrganizationId,
  ).toBe(true);
  expect(
    audit(options.root, [options.key, other], [organizationId]).files,
  ).toBe(6);
  const key = prepareCaptureTestCase(
    http.url,
    options,
    { name: "key-reflection" },
    { row: "synthetic/key-reflection" },
  );
  await expect(record(key.path, key.run, options)).rejects.toThrow(
    "sensitive-data",
  );
  liftStop(2, "reviewer", "synthetic review", options);
  const identity = prepareCaptureTestCase(
    http.url,
    options,
    { name: "other-identity" },
    { row: "synthetic/other-identity" },
  );
  await expect(record(identity.path, identity.run, options)).rejects.toThrow(
    "sensitive-data",
  );
  expect(existsSync(join(dirname(identity.path), "response.body"))).toBe(false);
  writeFileSync(join(dirname(first.path), "response.body"), options.key);
  expect(function () {
    audit(options.root, [options.key], [organizationId]);
  }).toThrow("sensitive-data");
});

it("records the real HTTP body exactly and removes account headers before writing", async function () {
  using dir = createTempDir("capture-headers-");
  const bytes = new TextEncoder().encode(
    'event: ping\r\ndata: {"type":"ping"}\r\n\r\nevent: content_block_delta\r\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"雪 ☀"}}\r\n\r\nevent: message_delta\r\ndata: {"type":"message_delta","usage":{"input_tokens":10,"output_tokens":2}}\r\n\r\nevent: message_stop\r\ndata: {"type":"message_stop"}\r\n\r\n',
  );
  let received = "";
  await using http = createLoopbackServer(async function (incoming) {
    expect(incoming.headers.get("x-api-key")).toBe("synthetic-secret-key-93");
    expect(incoming.headers.get("accept-encoding")).toBe("identity");
    received = await incoming.text();
    return new Response(bytes, {
      headers: {
        "Content-Type": "text/event-stream",
        "request-id": "synthetic-request",
        "anthropic-organization-id": "account-sentinel",
        "Anthropic-Workspace-Id": "workspace-sentinel",
        "OpenAI-Project": "project-sentinel",
        "set-cookie": "private-cookie",
        "x-new-account-id": "unknown-account-sentinel",
        "x-api-key": "synthetic-secret-key-93",
        "x-ratelimit-remaining-project-tokens": "12",
      },
    });
  });
  const options = createCaptureOptions(dir.path, http.url);
  const input = prepareCaptureTestCase(http.url, options);
  const requestBody = readFileSync(
    join(dirname(input.path), "request.body"),
    "utf8",
  );
  const result = await record(input.path, input.run, options);
  expect(result.status).toBe(200);
  expect(result.state).toBe("complete");
  expect(received).toBe(requestBody);
  expect(readFileSync(join(dirname(input.path), "response.body"))).toEqual(
    Buffer.from(bytes),
  );
  const transport = JSON.parse(
    readFileSync(join(dirname(input.path), "transport.json"), "utf8"),
  );
  expect(
    (transport.lengths as number[]).reduce(function (sum, length) {
      return sum + length;
    }, 0),
  ).toBe(bytes.length);
  expect(transport.boundary).toBe("fetch-body-reader");
  expect(result.usage).toEqual({ input_tokens: 10, output_tokens: 2 });
  expect(result.costUsd).toBeCloseTo(0.00004, 8);
  const metadata = JSON.parse(
    readFileSync(join(dirname(input.path), "response.json"), "utf8"),
  );
  expect(metadata.excludedHeaders).toMatchObject({ identity: 6 });
  expect(metadata.headers).toMatchObject({
    "request-id": "synthetic-request",
    "x-ratelimit-remaining-project-tokens": "12",
  });
  expect(
    audit(options.root, [
      options.key,
      "account-sentinel",
      "workspace-sentinel",
      "project-sentinel",
      "private-cookie",
      "unknown-account-sentinel",
    ]).files,
  ).toBe(6);
  for (const file of listCaptureFiles(dir.path)) {
    expect(readFileSync(file).includes(options.key)).toBe(false);
    expect(readFileSync(file).includes("account-sentinel")).toBe(false);
  }
  expect(JSON.parse(readFileSync(input.path, "utf8")).headers).toEqual({
    "content-type": "application/json",
    "accept-encoding": "identity",
  });
});

const { ROOT } = ResolveCaptureRootUnit;

Deno.test({
  name: "prints only the safe diagnosis from a real recorder subprocess",
  fn: async function () {
    using directory = createTempDir("capture-subprocess-");
    const root = directory.path;
    const value = "synthetic-private-response-value-93";
    await using http = createLoopbackServer(function () {
      return new Response(value, { headers: { "x-account-id": value } });
    });
    const options = createCaptureOptions(root, http.url);
    const input = prepareCaptureTestCase(http.url, options);
    const childPath = join(
      ROOT,
      "packages",
      "inference",
      "src",
      "scan.response",
      "fixtures",
      "subprocess-probe",
      "child",
    );
    const executable = Deno.execPath();
    const read = [
      root,
      join(ROOT, "packages", "inference"),
      join(ROOT, "packages", "protocol"),
      join(ROOT, "packages", "std"),
      join(ROOT, "node_modules"),
      join(ROOT, "package.json"),
      join(ROOT, "pnpm-workspace.yaml"),
    ];
    const result = await new Deno.Command(executable, {
      args: [
        "run",
        "--no-check",
        "--no-prompt",
        `--allow-read=${read.join(",")}`,
        `--allow-write=${root}`,
        "--allow-env=KUIB_ANTHROPIC_API_KEY",
        "--allow-net=127.0.0.1",
        childPath,
        input.path,
        JSON.stringify(input.run),
        JSON.stringify({ ...options, key: undefined }),
      ],
      env: { KUIB_ANTHROPIC_API_KEY: options.key },
      clearEnv: true,
      cwd: ROOT,
      stdout: "piped",
      stderr: "piped",
    }).output();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    if (result.code !== 0)
      throw new Error(
        `subprocess-failed ${stderr.replaceAll(value, "[redacted]").replaceAll(options.key, "[redacted]")}`,
      );
    const diagnosis = JSON.parse(stdout);
    if (
      diagnosis.kind !== "response-header" ||
      diagnosis.header !== "x-account-id" ||
      diagnosis.length !== value.length ||
      diagnosis.form !== "raw" ||
      diagnosis.blob !== "response-body"
    )
      throw new Error("unsafe-diagnosis");
    if (stderr.trim() !== "sensitive-data") throw new Error("unsafe-stderr");
    if (
      (stdout + stderr).includes(value) ||
      (stdout + stderr).includes(options.key)
    )
      throw new Error("secret-in-output");
    for (const file of listCaptureFiles(options.root))
      if (readFileSync(file, "utf8").includes(value))
        throw new Error("secret-on-disk");
  },
});
