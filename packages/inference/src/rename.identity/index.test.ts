import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createFixtureCase from "../create.fixture.case/index.ts";
import createPreparedRequest from "../create.prepared.request/index.ts";
import rename from "./index.ts";
import Protocol from "@kuib-ai/protocol";
import createLoopbackServer from "@kuib-ai/testing/create.loopback.server";
import createCaptureOptions from "../create.capture.options/index.ts";
import prepareCaptureTestCase from "../prepare.capture.test.case/index.ts";
import record from "../record.exchange/index.ts";
import refile from "../refile.cases/index.ts";

it("renames a former provider identity without changing a request body", function () {
  using dir = createTempDir("capture-rename-");
  createFixtureCase(
    dir.path,
    "openai-chat/former/muse-spark-1-1/case",
    createPreparedRequest({ provider: "former" as never }),
  );
  createFixtureCase(
    dir.path,
    "openai-chat/meta/muse-spark-1-1/dependent",
    createPreparedRequest({
      name: "dependent",
      replay: {
        fixture: "openai-chat/former/muse-spark-1-1/case",
        changes: [],
      },
    }),
  );
  expect(rename(dir.path, "provider", "former", "meta")).toBe(1);
  const path = join(dir.path, "openai-chat", "meta", "muse-spark-1-1", "case");
  expect(existsSync(join(path, "request.json"))).toBe(true);
  expect(readFileSync(join(path, "request.body"))).toEqual(
    Buffer.from([0, 255, 10]),
  );
  const dependent = JSON.parse(
    readFileSync(
      join(
        dir.path,
        "openai-chat",
        "meta",
        "muse-spark-1-1",
        "dependent",
        "request.json",
      ),
      "utf8",
    ),
  );
  expect(dependent.replay.fixture).toBe("openai-chat/meta/muse-spark-1-1/case");
});

it("renames a former enum value and refiles a case without changing body bytes", async function () {
  using dir = createTempDir("capture-rename-recorded-");
  await using http = createLoopbackServer(function () {
    return new Response("recorded response");
  });
  const options = createCaptureOptions(dir.path, http.url);
  const requestChanges = {
    provider: Protocol.ProviderEnum.XIAOMI,
    model: Protocol.ModelEnum.MIMO_V2_6_PRO,
    url: `${http.url}/anthropic/v1/messages`,
    body: JSON.stringify({
      model: "mimo-v2.6-pro",
      max_tokens: 32,
      messages: [],
    }),
  };
  const { path, run } = prepareCaptureTestCase(
    http.url,
    options,
    requestChanges,
  );
  await record(path, run, options);
  const original = dirname(path);
  const requestBody = readFileSync(join(original, "request.body"));
  const responseBody = readFileSync(join(original, "response.body"));
  const former = join(
    options.root,
    Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
    "mimo",
    requestChanges.model,
    "plain",
  );
  mkdirSync(dirname(former), { recursive: true });
  renameSync(original, former);
  const envelope = JSON.parse(
    readFileSync(join(former, "request.json"), "utf8"),
  );
  envelope.provider = "mimo";
  writeFileSync(join(former, "request.json"), JSON.stringify(envelope));
  expect(
    rename(options.root, "provider", "mimo", Protocol.ProviderEnum.XIAOMI),
  ).toBe(1);
  expect(
    JSON.parse(readFileSync(join(original, "request.json"), "utf8")).provider,
  ).toBe(Protocol.ProviderEnum.XIAOMI);
  expect(readFileSync(join(original, "request.body"))).toEqual(requestBody);
  expect(readFileSync(join(original, "response.body"))).toEqual(responseBody);
  const loose = join(options.root, "unfiled", "plain");
  mkdirSync(dirname(loose), { recursive: true });
  renameSync(original, loose);
  expect(refile(options.root)).toBe(1);
  expect(readFileSync(join(original, "request.body"))).toEqual(requestBody);
  expect(readFileSync(join(original, "response.body"))).toEqual(responseBody);
  await expect(
    record(join(original, "request.json"), run, {
      ...options,
      ledger: join(dir.path, "another-run.jsonl"),
    }),
  ).rejects.toThrow("capture-exists");
});
