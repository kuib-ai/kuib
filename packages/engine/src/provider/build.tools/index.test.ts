import { describe, it, expect } from "bun:test";
import { z } from "zod";
import Tools from "@kuib-ai/tools";
import type { ToolContext } from "@kuib-ai/tools/tool.spec";
import buildTools from "./index";

const ctx: ToolContext = {
  fs: {
    readFile: async function () {
      return { content: "" };
    },
    async readDir() {
      return { content: "" };
    },
  },
};

describe("buildTools", function () {
  it("builds a record keyed by spec.name", function () {
    const alpha = Tools.defineTool({
      name: "alpha",
      description: "a",
      input: z.object({ x: z.number() }),
      execute: async function () {
        return "ok";
      },
    });
    const beta = Tools.defineTool({
      name: "beta",
      description: "b",
      input: z.object({}),
      execute: async function () {
        return "ok";
      },
    });
    const tools = buildTools([alpha, beta], ctx);
    expect(Object.keys(tools)).toEqual(["alpha", "beta"]);
  });

  it("parses input before calling definition.execute with ctx", async function () {
    const receivedInputs: unknown[] = [];
    const receivedCtxs: ToolContext[] = [];
    const spec = Tools.defineTool({
      name: "coerce",
      description: "c",
      input: z.object({ n: z.coerce.number() }),
      execute: async function (input, execCtx) {
        receivedInputs.push(input);
        receivedCtxs.push(execCtx);
        return "done";
      },
    });
    const tools = buildTools([spec], ctx);
    const coerce = tools["coerce"];
    expect(coerce).toBeDefined();
    const result = await coerce?.execute?.(
      { n: "42" },
      { toolCallId: "t1", messages: [], context: undefined },
    );
    expect(receivedInputs[0]).toEqual({ n: 42 });
    expect(receivedCtxs[0]).toBe(ctx);
    expect(result).toBe("done");
  });
});
