// @context @journal/domains/core#^C002
import defineTool from "./tool.spec/index.ts";
import readFile from "./read.file/index.ts";
import readDir from "./read.dir/index.ts";

const Tools = {
  defineTool,
  readFile,
  readDir,
};

export default Tools;
