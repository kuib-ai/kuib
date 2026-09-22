// @claim core/agent-tools
import Protocol from "@kuib-ai/protocol";
import defineTool from "../tool.spec/index.ts";

// @claim core/agent-tools
const readFile = defineTool({
  name: "readFile",
  description:
    "Read the contents of a file from the target machine by absolute or relative path.",
  input: Protocol.FileSystem.ReadFileInput,
  execute: function (input, ctx) {
    return ctx.fs.readFile(input);
  },
});

export default readFile;
