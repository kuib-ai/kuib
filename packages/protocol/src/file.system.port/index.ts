// @context @journal/tool-system
import type { ReadFileInput } from "../file.system/read.file.input";
import type { ReadFileOutput } from "../file.system/read.file.output";

interface FileSystemPort {
  readFile(input: ReadFileInput): Promise<ReadFileOutput>;
}

export type { FileSystemPort };
