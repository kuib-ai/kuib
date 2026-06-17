import type { ModelMessage } from "ai";
import { createInterface } from "node:readline/promises";

import { configDotenv } from "dotenv";
import { createAgent } from "./agent.ts";

// Erasable syntax only (no enum) so `node src/index.ts` runs without a
// transform step — Node's type stripping is strip-only.
const NODE_ENVIRONMENTS = ["development", "staging", "production"] as const;
type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

const nodeEnvironment = process.env.NODE_ENV;

if (!nodeEnvironment) {
  throw new Error("NODE_ENV is not set");
}

if (!NODE_ENVIRONMENTS.includes(nodeEnvironment as NodeEnvironment)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnvironment}`);
}

configDotenv({
  path: `../../.env.${nodeEnvironment}`,
});

const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = createAgent();
  const messages: ModelMessage[] = [];

  console.log("kuib · mimo smoke test — type /exit to quit\n");

  while (true) {
    const userInput = await terminal.question("User: ");

    if (userInput.trim() === "/exit") {
      break;
    }

    messages.push({ role: "user", content: userInput });

    const result = await agent.stream({ messages });

    process.stdout.write("\nAssistant: ");
    for await (const part of result.fullStream) {
      switch (part.type) {
        case "text-delta":
          process.stdout.write(part.text);
          break;
        case "tool-call":
          process.stdout.write(
            `\n  ↳ ${part.toolName}(${JSON.stringify(part.input)})\n`,
          );
          break;
        case "tool-result":
          process.stdout.write(
            `  ↳ ${part.toolName} → ${JSON.stringify(part.output)}\n`,
          );
          break;
        case "tool-error":
          process.stdout.write(
            `  ↳ ${part.toolName} ✗ ${String(part.error)}\n`,
          );
          break;
      }
    }

    // Persist the model's turn (assistant text + any tool calls/results) so the
    // next request resends a stable prefix — that prefix is what MiMo caches.
    const response = await result.response;
    messages.push(...response.messages);

    const usage = await result.totalUsage;
    process.stdout.write(
      `\n\n[usage] input=${usage.inputTokens} output=${usage.outputTokens} ` +
        `cacheRead=${usage.inputTokenDetails?.cacheReadTokens ?? 0} ` +
        `total=${usage.totalTokens}\n`,
    );
    if (usage.raw) {
      // MiMo's native cache fields (whatever it returns) land here untouched.
      process.stdout.write(`[usage.raw] ${JSON.stringify(usage.raw)}\n\n`);
    }
  }

  terminal.close();
}

main().catch(console.error);
