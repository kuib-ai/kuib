import { ModelMessage, streamText } from "ai";
import { createInterface } from "node:readline/promises";

import { configDotenv } from "dotenv";
import { createOpenAI } from "@ai-sdk/openai";

const nodeEnvironment = process.env.NODE_ENV;

enum NodeEnvironment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

if (!nodeEnvironment) {
  throw new Error("NODE_ENV is not set");
}

export function isEnumValue<T extends Record<string | number, string | number>>(
  value: unknown,
  enumObject: T,
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as string | number);
}

if (!isEnumValue(nodeEnvironment, NodeEnvironment)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnvironment}`);
}

configDotenv({
  path: `../../.env.${nodeEnvironment}`,
});

console.log({
  bootstrappedEnvironment: process.env,
});

const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

const xiaomiProvider = createOpenAI({
  apiKey: process.env.XIAOMI_API_KEY,
  baseURL: "https://api.xiaomimimo.com/v1",
});

const mimoModel = xiaomiProvider.chat("mimo-v2.5-pro");

async function main() {
  while (true) {
    const userInput = await terminal.question("User: ");

    messages.push({
      role: "user",
      content: userInput,
    });

    const result = streamText({
      messages,
      model: mimoModel,
    });

    let fullResponse = "";

    process.stdout.write("\nAssistant: ");
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }

    process.stdout.write("\n\n");

    messages.push({
      role: "assistant",
      content: fullResponse,
    });
  }
}

main().catch(console.error).finally(console.log).then(console.log);
