// @context @journal/tool-system
import Protocol from "@kuib-ai/protocol";
import defineTool from "../tool.spec";

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
