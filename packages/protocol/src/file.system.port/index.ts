// @context @journal/tool-system
import type { ReadDirInput } from "../file.system/read.dir.input";
import type { ReadDirOutput } from "../file.system/read.dir.output";
import type { ReadFileInput } from "../file.system/read.file.input";
import type { ReadFileOutput } from "../file.system/read.file.output";

interface FileSystemPort {
  readFile(input: ReadFileInput): Promise<ReadFileOutput>;
  readDir(input: ReadDirInput): Promise<ReadDirOutput>;
}

export type { FileSystemPort };
