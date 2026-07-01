// @context @journal/tool-system
import type { ToolSpec } from "../tool.spec";
import readFile from "../read.file";

const toolRegistry: readonly ToolSpec[] = [readFile];

export default toolRegistry;
