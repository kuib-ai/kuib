import { tool } from "ai";
import { z } from "zod";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

// All tool paths are resolved against — and confined to — the directory the
// agent is launched from.
const ROOT = process.cwd();

function resolveWithinRoot(path: string): string {
  const full = resolve(ROOT, path);
  const rel = relative(ROOT, full);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`path escapes the workspace root: ${path}`);
  }

  return full;
}

export const fsTools = {
  read_file: tool({
    description: "Read a UTF-8 text file, relative to the workspace root.",
    inputSchema: z.object({
      path: z.string().describe("File path relative to the workspace root"),
    }),
    execute: async ({ path }) => {
      const content = await readFile(resolveWithinRoot(path), "utf8");
      return { path, content };
    },
  }),

  list_dir: tool({
    description:
      "List the entries of a directory, relative to the workspace root.",
    inputSchema: z.object({
      path: z
        .string()
        .default(".")
        .describe("Directory path relative to the workspace root"),
    }),
    execute: async ({ path }) => {
      const entries = await readdir(resolveWithinRoot(path), {
        withFileTypes: true,
      });
      return {
        path,
        entries: entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "dir" : "file",
        })),
      };
    },
  }),

  write_file: tool({
    description:
      "Write (creating or overwriting) a UTF-8 text file, relative to the workspace root.",
    inputSchema: z.object({
      path: z.string().describe("File path relative to the workspace root"),
      content: z.string().describe("Full contents to write to the file"),
    }),
    execute: async ({ path, content }) => {
      await writeFile(resolveWithinRoot(path), content, "utf8");
      return { path, bytesWritten: Buffer.byteLength(content, "utf8") };
    },
  }),
};
