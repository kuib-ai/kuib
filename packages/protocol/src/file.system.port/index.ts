// @context @journal/domains/core#^C013
import type { ReadDirInput } from "../file.system/read.dir.input/index.ts";
import type { ReadDirOutput } from "../file.system/read.dir.output/index.ts";
import type { ReadFileInput } from "../file.system/read.file.input/index.ts";
import type { ReadFileOutput } from "../file.system/read.file.output/index.ts";

interface FileSystemPort {
  readFile(input: ReadFileInput): Promise<ReadFileOutput>;
  readDir(input: ReadDirInput): Promise<ReadDirOutput>;
}

export type { FileSystemPort };
