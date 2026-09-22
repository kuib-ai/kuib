// @claim core/define-tool
import type { z } from "zod";
import type { FileSystemPort } from "@kuib-ai/protocol/file.system.port";

// @claim core/define-tool
type ToolContext = {
  fs: FileSystemPort;
};

type ToolDefinition<Input extends z.ZodType> = {
  name: string;
  description: string;
  input: Input;
  execute: (input: z.infer<Input>, ctx: ToolContext) => Promise<unknown>;
};

// @claim core/define-tool
type ToolSpec = {
  name: string;
  description: string;
  use: <Result>(
    consume: <Input extends z.ZodType>(
      definition: ToolDefinition<Input>,
    ) => Result,
  ) => Result;
};

// @claim core/define-tool
const defineTool = function <Input extends z.ZodType>(
  definition: ToolDefinition<Input>,
): ToolSpec {
  return {
    name: definition.name,
    description: definition.description,
    use: function (consume) {
      return consume(definition);
    },
  };
};

export default defineTool;
export type { ToolSpec, ToolContext, ToolDefinition };
