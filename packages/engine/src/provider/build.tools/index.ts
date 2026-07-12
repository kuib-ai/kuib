// @context @journal/tool-system
import { tool, type Tool } from "ai";
import type { ToolSpec, ToolContext } from "@kuib-ai/tools/tool.spec";

const buildTools = function (
  specs: readonly ToolSpec[],
  ctx: ToolContext,
): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  for (const spec of specs) {
    tools[spec.name] = spec.use(function (definition) {
      return tool({
        description: definition.description,
        inputSchema: definition.input,
        execute: function (input) {
          return definition.execute(definition.input.parse(input), ctx);
        },
      });
    });
  }
  return tools;
};

export default buildTools;
