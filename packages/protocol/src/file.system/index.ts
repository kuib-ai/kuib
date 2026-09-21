// @context @journal/tool-system
import ReadDirInput from "./read.dir.input/index.ts";
import ReadDirOutput from "./read.dir.output/index.ts";
import ReadFileInput from "./read.file.input/index.ts";
import ReadFileOutput from "./read.file.output/index.ts";

const FileSystem = {
  ReadFileInput,
  ReadFileOutput,
  ReadDirInput,
  ReadDirOutput,
};

export default FileSystem;
