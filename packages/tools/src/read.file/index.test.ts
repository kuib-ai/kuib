import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import Daemon from "@kuib-ai/daemon";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ToolContext } from "../tool.spec/index.ts";
import readFile from "./index.ts";

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
    using dir = createTempDir();
    const path = join(dir.path, "hello.txt");
    writeFileSync(path, "hello world");
    const ctx: ToolContext = { fs: Daemon.createDaemonCaller({}) };
    const result = await readFile.use(function (definition) {
      return definition.execute(definition.input.parse({ path }), ctx);
    });
    expect(result).toEqual({ content: "hello world" });
  });
});
