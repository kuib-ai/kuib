// @claim core/fs-io-schemas
import ReadDirInput from "./read.dir.input/index.ts";
import ReadDirOutput from "./read.dir.output/index.ts";
import ReadFileInput from "./read.file.input/index.ts";
import ReadFileOutput from "./read.file.output/index.ts";

// @claim core/fs-io-schemas
const FileSystem = {
  ReadFileInput,
  ReadFileOutput,
  ReadDirInput,
  ReadDirOutput,
};

export default FileSystem;
