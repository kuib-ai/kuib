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

  edit_file: tool({
    description:
      "Edit a text file with multiple operations. More efficient than reading and rewriting the whole file.",
    inputSchema: z.object({
      path: z.string().describe("File path relative to the workspace root"),
      operations: z
        .array(
          z.discriminatedUnion("type", [
            z.object({
              type: z.literal("replace"),
              find: z.string().describe("Text or regex pattern to find"),
              replace: z.string().describe("Replacement text"),
              regex: z
                .boolean()
                .default(false)
                .describe("Treat find as regex pattern"),
              flags: z
                .string()
                .default("g")
                .describe(
                  "Regex flags (e.g., 'gi' for case-insensitive global)",
                ),
              all: z
                .boolean()
                .default(true)
                .describe("Replace all occurrences or just first"),
            }),
            z.object({
              type: z.literal("insert"),
              after: z
                .string()
                .optional()
                .describe("Pattern or line number to insert after"),
              before: z
                .string()
                .optional()
                .describe("Pattern or line number to insert before"),
              content: z.string().describe("Text to insert"),
            }),
            z.object({
              type: z.literal("delete"),
              lines: z
                .array(z.number())
                .optional()
                .describe("Line numbers to delete (1-based)"),
              between: z
                .object({
                  start: z.string().describe("Start pattern"),
                  end: z.string().describe("End pattern"),
                  inclusive: z
                    .boolean()
                    .default(false)
                    .describe("Include start/end patterns in deletion"),
                })
                .optional()
                .describe("Delete text between patterns"),
            }),
            z.object({
              type: z.literal("append"),
              content: z.string().describe("Text to append to end of file"),
            }),
            z.object({
              type: z.literal("prepend"),
              content: z
                .string()
                .describe("Text to prepend to beginning of file"),
            }),
          ]),
        )
        .describe("Array of edit operations to apply sequentially"),
    }),
    execute: async ({ path, operations }) => {
      const filePath = resolveWithinRoot(path);
      let content = await readFile(filePath, "utf8");
      let lines = content.split("\n");
      const changes: Array<{ operation: string; details: string }> = [];

      for (const op of operations) {
        switch (op.type) {
          case "replace": {
            if (op.regex) {
              // Handle regex replacement
              const flags = op.flags.replace("g", "") + (op.all ? "g" : "");
              const regex = new RegExp(op.find, flags);
              const matches = content.match(regex);

              if (matches && matches.length > 0) {
                content = content.replace(regex, op.replace);
                changes.push({
                  operation: "replace",
                  details: `Replaced ${matches.length} regex matches of "${op.find}"`,
                });
              }
            } else {
              // Handle plain text replacement
              const count = op.all
                ? content.split(op.find).length - 1
                : content.includes(op.find)
                  ? 1
                  : 0;

              if (count > 0) {
                if (op.all) {
                  content = content.split(op.find).join(op.replace);
                } else {
                  content = content.replace(op.find, op.replace);
                }

                changes.push({
                  operation: "replace",
                  details: `Replaced ${count} occurrence(s) of "${op.find}"`,
                });
              }
            }
            lines = content.split("\n");
            break;
          }

          case "insert": {
            if (op.after && op.before) {
              throw new Error("Cannot specify both 'after' and 'before'");
            }

            const target = op.after || op.before;
            if (!target) {
              throw new Error("Must specify either 'after' or 'before'");
            }

            const lineNum = parseInt(target);
            let insertIndex: number;

            if (!isNaN(lineNum)) {
              // Insert by line number
              insertIndex = op.after ? lineNum : lineNum - 1;
              if (insertIndex < 0 || insertIndex > lines.length) {
                throw new Error(`Line number ${lineNum} out of range`);
              }
            } else {
              // Insert by pattern
              const patternIndex = lines.findIndex((line) =>
                line.includes(target),
              );
              if (patternIndex === -1) {
                throw new Error(`Pattern "${target}" not found`);
              }
              insertIndex = op.after ? patternIndex + 1 : patternIndex;
            }

            const insertLines = op.content.split("\n");
            lines.splice(insertIndex, 0, ...insertLines);
            content = lines.join("\n");

            changes.push({
              operation: "insert",
              details: `Inserted ${insertLines.length} line(s) ${op.after ? "after" : "before"} ${target}`,
            });
            break;
          }

          case "delete": {
            if (op.lines && op.between) {
              throw new Error("Cannot specify both 'lines' and 'between'");
            }

            if (op.lines) {
              // Delete specific lines (1-based)
              const linesToDelete = new Set(op.lines);
              const newLines = lines.filter(
                (_, index) => !linesToDelete.has(index + 1),
              );
              const deletedCount = lines.length - newLines.length;

              if (deletedCount === 0) {
                throw new Error(`No lines matched: ${op.lines.join(", ")}`);
              }

              lines = newLines;
              content = lines.join("\n");

              changes.push({
                operation: "delete",
                details: `Deleted ${deletedCount} line(s)`,
              });
            } else if (op.between) {
              // Delete between patterns
              const startIndex = lines.findIndex((line) =>
                line.includes(op.between!.start),
              );
              if (startIndex === -1) {
                throw new Error(
                  `Start pattern "${op.between.start}" not found`,
                );
              }

              const endIndex = lines.findIndex(
                (line, index) =>
                  index > startIndex && line.includes(op.between!.end),
              );
              if (endIndex === -1) {
                throw new Error(
                  `End pattern "${op.between.end}" not found after start pattern`,
                );
              }

              const deleteStart = op.between.inclusive
                ? startIndex
                : startIndex + 1;
              const deleteEnd = op.between.inclusive ? endIndex + 1 : endIndex;

              if (deleteStart >= deleteEnd) {
                throw new Error("No lines to delete between patterns");
              }

              const deletedCount = deleteEnd - deleteStart;
              lines.splice(deleteStart, deletedCount);
              content = lines.join("\n");

              changes.push({
                operation: "delete",
                details: `Deleted ${deletedCount} line(s) between "${op.between.start}" and "${op.between.end}"`,
              });
            } else {
              throw new Error("Must specify either 'lines' or 'between'");
            }
            break;
          }

          case "append": {
            if (!content.endsWith("\n") && content.length > 0) {
              content += "\n";
            }
            content += op.content;
            lines = content.split("\n");

            changes.push({
              operation: "append",
              details: `Appended ${op.content.split("\n").length} line(s)`,
            });
            break;
          }

          case "prepend": {
            content = op.content + "\n" + content;
            lines = content.split("\n");

            changes.push({
              operation: "prepend",
              details: `Prepended ${op.content.split("\n").length} line(s)`,
            });
            break;
          }
        }
      }

      await writeFile(filePath, content, "utf8");

      return {
        path,
        bytesWritten: Buffer.byteLength(content, "utf8"),
        changes,
        preview:
          content.length > 500 ? content.substring(0, 500) + "..." : content,
      };
    },
  }),
};
