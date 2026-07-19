import { describe, it, expect } from "bun:test";
import type { FileSystemPort } from "@kuib-ai/protocol/file.system.port";
import type { ReadFileInput } from "@kuib-ai/protocol/file.system/read.file.input";
import type { ReadFileOutput } from "@kuib-ai/protocol/file.system/read.file.output";
import type { ToolContext } from "../tool.spec";
import readFile from "./index";

describe("readFile tool", function () {
  it("exposes name, description, and input schema", function () {
    expect(readFile.name).toBe("readFile");
    expect(readFile.description.length).toBeGreaterThan(0);
    readFile.use(function (definition) {
      const parsed: unknown = definition.input.parse({ path: "/a/b" });
      expect(parsed).toEqual({ path: "/a/b" });
      return null;
    });
  });

  it("delegates input to ctx.fs.readFile and returns its result", async function () {
    const seen: ReadFileInput[] = [];
    const output: ReadFileOutput = { content: "hello world" };
    const fs: Pick<FileSystemPort, "readFile"> = {
      readFile: async function (input) {
        seen.push(input);
        return output;
      },
    };
    const ctx: ToolContext = { fs };
    const result = await readFile.use(function (definition) {
      return definition.execute(
        definition.input.parse({ path: "/etc/hosts" }),
        ctx,
      );
    });
    expect(seen).toEqual([{ path: "/etc/hosts" }]);
    expect(result).toBe(output);
  });
});
