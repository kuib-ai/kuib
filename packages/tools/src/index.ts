// @context @journal/tool-system
import toolRegistry from "./tool.registry";
import defineTool from "./tool.spec";

const Tools = {
  registry: toolRegistry,
  defineTool,
};

export default Tools;
export type { ToolSpec, ToolContext, ToolDefinition } from "./tool.spec";
