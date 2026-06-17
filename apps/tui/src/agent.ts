import { ToolLoopAgent, stepCountIs } from "ai";
import { createMimoModel } from "./provider.ts";
import { fsTools } from "./tools.ts";

// Kept stable across turns so it forms a constant prompt prefix — this is what
// lets MiMo's automatic prefix cache actually land hits.
const INSTRUCTIONS = `You are Kuib, a small CLI assistant used to smoke-test the Xiaomi MiMo model.

You have filesystem tools scoped to the current workspace directory:
- read_file: read a text file
- list_dir: list a directory
- write_file: create or overwrite a text file

Use the tools instead of guessing about files. Be concise.`;

export function createAgent() {
  return new ToolLoopAgent({
    model: createMimoModel(),
    instructions: INSTRUCTIONS,
    tools: fsTools,
    stopWhen: stepCountIs(10),
  });
}
