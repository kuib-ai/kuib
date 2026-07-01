// @context @journal/tool-system
import type { z } from "zod";
import type { FileSystemPort } from "@kuib-ai/protocol/file.system.port";

type ToolContext = {
  fs: FileSystemPort;
};

type ToolDefinition<Input extends z.ZodType> = {
  name: string;
  description: string;
  input: Input;
  execute: (input: z.infer<Input>, ctx: ToolContext) => Promise<unknown>;
};

type ToolSpec = {
  name: string;
  description: string;
  use: <Result>(
    consume: <Input extends z.ZodType>(
      definition: ToolDefinition<Input>,
    ) => Result,
  ) => Result;
};

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
