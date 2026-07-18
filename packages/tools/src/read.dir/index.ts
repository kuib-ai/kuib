// @context @journal/tool-system
import Protocol from "@kuib-ai/protocol";
import defineTool from "../tool.spec";

const readDir = defineTool({
  name: "readDir",
  description:
    "Read the contents of a directory from the target machine by absolute or relative path.",
  input: Protocol.FileSystem.ReadDirInput,
  execute: function (input, ctx) {
    return ctx.fs.readDir(input);
  },
});

export default readDir;
