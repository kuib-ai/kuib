import { describe, it, expect } from "bun:test";
import { z } from "zod";
import defineTool from "./index";
import type { ToolDefinition, ToolContext } from "./index";

const ctx: ToolContext = {
  fs: {
    readFile: async function () {
      return { content: "" };
    },
  },
};

const input = z.object({ path: z.string() });

const definition: ToolDefinition<typeof input> = {
  name: "read-file",
  description: "reads a file",
  input,
  execute: async function (args) {
    return `read:${args.path}`;
  },
};

describe("defineTool", function () {
  it("mirrors name and description onto the spec", function () {
    const spec = defineTool(definition);
    expect(spec.name).toBe("read-file");
    expect(spec.description).toBe("reads a file");
  });

  it("use invokes consume with the original definition and returns its result", function () {
    const spec = defineTool(definition);
    const seen = spec.use(function (d) {
      return d;
    });
    expect(seen).toBe(definition);

    const names = spec.use(function (d) {
      return d.name;
    });
    expect(names).toBe("read-file");
  });

  it("exposes execute through the definition passed to consume", async function () {
    const spec = defineTool(definition);
    const result = await spec.use(function (d) {
      return d.execute(d.input.parse({ path: "a.txt" }), ctx);
    });
    expect(result).toBe("read:a.txt");
  });
});
