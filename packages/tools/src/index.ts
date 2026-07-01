// @context @journal/tool-system
import toolRegistry from "./tool.registry";

const Tools = {
  registry: toolRegistry,
};

export default Tools;
export type { ToolSpec, ToolContext } from "./tool.spec";
