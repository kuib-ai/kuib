// @context @journal/domains/core#^C032
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Protocol from "@kuib-ai/protocol";
import Provider from "./index.ts";
import runAgent from "../orchestrator/index.ts";
import createMemoryEventLog from "../event.log/memory.event.log/index.ts";

const ENABLED = process.env["KUIB_LLM_TESTS"] === "1";

const loadDotEnv = function (): void {
  const path = resolve(import.meta.dirname!, "../../../../.env");
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match && process.env[match[1]!] === undefined) {
      process.env[match[1]!] = match[2]!;
    }
  }
};

if (ENABLED) {
  loadDotEnv();
}

const resolveFromEnv = function () {
  return Provider.resolveModelConfig({
    model: process.env["KUIB_MODEL"] ?? "mimo/mimo-v2.5-pro",
    baseURL: process.env["KUIB_MODEL_BASE_URL"],
    apiKey: process.env["KUIB_MODEL_API_KEY"],
    anthropicApiKey: process.env["KUIB_ANTHROPIC_API_KEY"],
    groqApiKey: process.env["KUIB_GROQ_API_KEY"],
    metaApiKey: process.env["KUIB_META_API_KEY"],
    mimoApiKey: process.env["KUIB_MIMO_API_KEY"],
    mimoBaseURL: process.env["KUIB_MIMO_BASE_URL"],
  });
};

const runTurn = async function (prompt: string) {
  const config = resolveFromEnv();
  const eventLog = createMemoryEventLog();
  const sessionID = Protocol.ID.SessionID.parse("live");
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());

  await runAgent({
    prompt,
    sessionID,
    deviceID,
    model: Provider.createModel(config),
    modelRef: Protocol.ModelRef.parse({
      providerID: config.providerID,
      modelID: config.modelID,
    }),
    providerOptions: Provider.buildProviderOptions(config),
    daemonClient: null as never,
    eventLog,
    maxSteps: 3,
  });

  let text = "";
  let reasoning = "";
  let tokens: Record<string, unknown> | null = null;
  eventLog.replay(sessionID, -1, function ({ event }) {
    if (event.type === Protocol.Event.EventTypeEnum.TEXT_DELTA) {
      text += event.delta;
    }
    if (event.type === Protocol.Event.EventTypeEnum.REASONING_DELTA) {
      reasoning += event.delta;
    }
    if (event.type === Protocol.Event.EventTypeEnum.STEP_FINISHED) {
      tokens = event.tokens;
    }
  });
  return { config, text, reasoning, tokens };
};

describe({ name: "live provider", ignore: !ENABLED }, function () {
  it("streams an answer from the configured provider", async function () {
    const { text } = await runTurn("Reply with exactly: OK");
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("reports token usage on the step boundary", async function () {
    const { tokens } = await runTurn("Reply with exactly: OK");
    expect(tokens).not.toBeNull();
    expect(tokens!["input"]).toBeGreaterThan(0);
  });

  it("streams reasoning when the provider exposes it", async function () {
    const { config, reasoning } = await runTurn(
      "If 3 machines make 3 widgets in 3 minutes, how long for 100 machines to make 100 widgets?",
    );
    if (config.providerID !== "mimo") {
      return;
    }
    expect(reasoning.trim().length).toBeGreaterThan(0);
  });
});
