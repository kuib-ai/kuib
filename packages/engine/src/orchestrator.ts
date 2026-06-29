import { streamText, tool, type LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { Client } from "@connectrpc/connect";
import { DaemonService } from "@kuib/protocol/src/gen/kuib/v1/daemon_pb.js";

// Pointing to your Minerva node over Tailscale
// Ollama provides an OpenAI compatible endpoint at /v1
export const minervaNode = createOpenAI({
  baseURL: "http://100.70.111.96:11434/v1",
  apiKey: "ollama",
});

export async function runAgent(
  prompt: string,
  daemonClient: Client<typeof DaemonService>,
  model: LanguageModelV1 = minervaNode("gemma4:12b"),
) {
  // Using Vercel AI SDK as the orchestrator
  // streamText with maxSteps handles the tool-calling loop automatically
  const result = await streamText({
    model,
    prompt,
    maxSteps: 5,
    tools: {
      executeCommand: tool({
        description: "Execute a bash shell command on the target daemon machine. Use this to run CLI commands, list directories, etc.",
        parameters: z.object({
          command: z.string().min(1, "Command cannot be empty").describe("The bash command to execute"),
          cwd: z.string().optional().describe("The working directory to execute the command in"),
        }),
        execute: async ({ command, cwd }) => {
          console.log(`\n[Agent Tool] Executing command: ${command}`);
          // Dispatch over the Mesh via ConnectRPC
          const res = await daemonClient.executeCommand({
            command,
            cwd: cwd || ".",
            env: {},
          });
          return {
            stdout: res.stdout,
            stderr: res.stderr,
            exitCode: res.exitCode,
          };
        },
      }),
      readFile: tool({
        description: "Read the entire contents of a file from the target daemon machine. Returns the file content as a string.",
        parameters: z.object({
          path: z.string().describe("The absolute or relative path to the file to read"),
        }),
        execute: async ({ path }) => {
          console.log(`\n[Agent Tool] Reading file: ${path}`);
          const res = await daemonClient.readFile({ path });
          return new TextDecoder().decode(res.content);
        },
      }),
      writeFile: tool({
        description: "Write string content to a file on the target daemon machine. This will overwrite the file if it exists.",
        parameters: z.object({
          path: z.string().describe("The absolute or relative path to the file to write"),
          content: z.string().describe("The full string content to write to the file"),
        }),
        execute: async ({ path, content }) => {
          console.log(`\n[Agent Tool] Writing file: ${path}`);
          await daemonClient.writeFile({
            path,
            content: new TextEncoder().encode(content)
          });
          return { success: true };
        }
      })
    },
    onStepFinish: (event) => {
      // This is where we would map AI SDK events to our @kuib/protocol EventLog
      // e.g. emitting PartStepBoundaryStop and ToolCallCompleted events to the TUI
      console.log(`[Step Finished] Tokens used: ${event.usage.totalTokens}`);
    },
  });

  // Example stream consumption
  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }
}
