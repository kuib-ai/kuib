import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";
import Capture from "../../../../../tooling/capture.ts";
import fixturePath from "../../../../../packages/inference/src/fixture.path/index.ts";
import { MessageFormatEnum } from "../../../../../packages/protocol/src/message.format.enum/index.ts";
import { ProviderEnum } from "../../../../../packages/protocol/src/provider.enum/index.ts";
import { ModelEnum } from "../../../../../packages/protocol/src/model.enum/index.ts";

const ROOT = resolve(import.meta.dirname!, "../../../../..");
const ORIGINAL = join(ROOT, "packages/inference/fixtures");
const STAGED = join(ROOT, "packages/inference/fixtures.next");
const MANIFEST = "/var/tmp/kuib-rename-fixtures/bodies.before.sha256";

const folders = {
  "anthropic-messages-claude-sonnet-5-5": [MessageFormatEnum.ANTHROPIC_MESSAGES, ProviderEnum.ANTHROPIC, ModelEnum.CLAUDE_SONNET_5_5],
  "anthropic-messages-claude-haiku-5-5": [MessageFormatEnum.ANTHROPIC_MESSAGES, ProviderEnum.ANTHROPIC, ModelEnum.CLAUDE_HAIKU_5_5],
  "anthropic-messages-claude-haiku-4-5-20251001": [MessageFormatEnum.ANTHROPIC_MESSAGES, ProviderEnum.ANTHROPIC, "claude-haiku-4-5-20251001"],
  "mimo-messages-mimo-v2-6-pro": [MessageFormatEnum.ANTHROPIC_MESSAGES, "mimo", ModelEnum.MIMO_V2_6_PRO],
  "mimo-chat-mimo-v2-6-pro": [MessageFormatEnum.OPENAI_CHAT, "mimo", ModelEnum.MIMO_V2_6_PRO],
  "meta-chat-muse-spark-1-1": [MessageFormatEnum.OPENAI_CHAT, ProviderEnum.META, ModelEnum.MUSE_SPARK_1_1],
} as const;

const names = {
  "001.request.json": "request.json",
  "001.request.body.json": "request.body",
  "001.response.json": "response.json",
  "001.response.bin": "response.body",
  "001.chunks.json": "transport.json",
  "sequence.json": "sequence.json",
  "fixture.json": "fixture.json",
} as const;

if (existsSync(STAGED)) throw new Error("stage already exists");
const hashes = new Map(readFileSync(MANIFEST, "utf8").trimEnd().split("\n").map(function (line) {
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
  if (!match) throw new Error("invalid manifest");
  return [match[2]!, match[1]!];
}));
const after = new Map<string, string>();
let requests = 0;
let responses = 0;

for (const oldPrefix of readdirSync(ORIGINAL)) {
  const parts = folders[oldPrefix as keyof typeof folders];
  if (!parts) throw new Error("unknown offering");
  for (const name of readdirSync(join(ORIGINAL, oldPrefix))) {
    const source = join(ORIGINAL, oldPrefix, name);
    const target = join(STAGED, oldPrefix, name);
    mkdirSync(target, { recursive: true });
    const sequence = JSON.parse(readFileSync(join(source, "sequence.json"), "utf8"));
    if (!Array.isArray(sequence) || sequence.length !== 1) throw new Error("multi-step case");
    for (const file of readdirSync(source)) {
      const nextName = names[file as keyof typeof names];
      if (!nextName) throw new Error("unknown case file");
      const from = join(source, file);
      const to = join(target, nextName);
      if (file === "001.request.body.json" || file === "001.response.bin") {
        copyFileSync(from, to);
        const key = relative(ROOT, from);
        const digest = createHash("sha256").update(readFileSync(to)).digest("hex");
        if (hashes.get(key) !== digest) throw new Error("body hash changed");
        after.set(key, digest);
        if (file === "001.request.body.json") requests++;
        else responses++;
      } else if (file === "001.request.json") {
        const request = JSON.parse(readFileSync(from, "utf8"));
        delete request.offering;
        delete request.step;
        request.messageFormat = parts[0];
        request.provider = parts[1];
        request.model = parts[2];
        request.name = name;
        request.bodyFile = "request.body";
        if (request.replay) delete request.replay.step;
        writeFileSync(to, `${JSON.stringify(request, null, 2).replaceAll("thinking-sampling-top_p", "thinking-sampling-top-p")}\n`);
      } else if (file === "sequence.json") {
        const entry = sequence[0];
        delete entry.step;
        entry.requestFile = "request.json";
        if (entry.replay) delete entry.replay.step;
        writeFileSync(to, `${JSON.stringify(sequence, null, 2).replaceAll("thinking-sampling-top_p", "thinking-sampling-top-p")}\n`);
      } else {
        copyFileSync(from, to);
      }
    }
  }
}
if (requests !== 709 || responses !== 707 || after.size !== hashes.size) throw new Error("body count changed");
const providerRenamed = Capture.rename(STAGED, "provider", "mimo", ProviderEnum.XIAOMI);
const modelRenamed = Capture.rename(STAGED, "model", "claude-haiku-4-5-20251001", ModelEnum.CLAUDE_HAIKU_4_5);
const filed = Capture.refile(STAGED);
let verified = 0;
for (const oldPrefix of readdirSync(ORIGINAL)) {
  const parts = folders[oldPrefix as keyof typeof folders];
  const provider = parts[1] === "mimo" ? ProviderEnum.XIAOMI : parts[1];
  const model = parts[2] === "claude-haiku-4-5-20251001" ? ModelEnum.CLAUDE_HAIKU_4_5 : parts[2];
  for (const name of readdirSync(join(ORIGINAL, oldPrefix))) {
    const folder = join(STAGED, fixturePath(parts[0], provider, model, name));
    const request = JSON.parse(readFileSync(join(folder, "request.json"), "utf8"));
    const sequence = JSON.parse(readFileSync(join(folder, "sequence.json"), "utf8"));
    for (const [oldName, newName] of [["001.request.body.json", "request.body"], ["001.response.bin", "response.body"]]) {
      const key = relative(ROOT, join(ORIGINAL, oldPrefix, name, oldName));
      const expected = hashes.get(key);
      if (expected === undefined) continue;
      const actual = createHash("sha256").update(readFileSync(join(folder, newName))).digest("hex");
      if (actual !== expected) throw new Error("final body hash changed");
      verified++;
    }
    for (const replay of [request.replay, sequence[0].replay]) {
      if (replay && !existsSync(join(STAGED, replay.fixture, "request.json"))) throw new Error("missing replay source");
    }
  }
}
if (verified !== 1416) throw new Error("final body count changed");
for (const folder of readdirSync(STAGED)) {
  if (!Object.values(MessageFormatEnum).includes(folder as MessageFormatEnum)) throw new Error("unknown format folder");
}
writeFileSync("/var/tmp/kuib-rename-fixtures/bodies.after.json", `${JSON.stringify(Object.fromEntries(after), null, 2)}\n`);
console.log(JSON.stringify({ requests, responses, providerRenamed, modelRenamed, filed, verified }));
