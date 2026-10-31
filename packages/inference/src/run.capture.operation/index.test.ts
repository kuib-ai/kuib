import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import main from "./index.ts";
import { existsSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureRequest from "../create.capture.request/index.ts";

it("refuses an unknown operation with a sanitized code before loading a credential", async function () {
  const errors: string[] = [];
  const original = console.error;
  const exitCode = Deno.exitCode;
  using _restore = {
    [Symbol.dispose]() {
      console.error = original;
      Deno.exitCode = exitCode;
    },
  };
  console.error = function (message) {
    errors.push(String(message));
  };
  await main(["unknown", "/var/tmp/capture-run"]);
  expect(errors[0]).toContain("(invalid-command)");
  expect(Deno.exitCode).toBe(1);
});

it("accepts preparation on stdin and refuses a synthetic credential without echoing or writing it", async function () {
  using dir = createTempDir("capture-stdin-");
  const key = "synthetic-secret-key-93";
  const body = JSON.stringify({
    model: "synthetic-model",
    max_tokens: 32,
    messages: [{ role: "user", content: key }],
  });
  const request = createCaptureRequest("https://api.anthropic.com", { body });
  const input = new ReadableStream<Uint8Array>({
    start: function (controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(request)));
      controller.close();
    },
  });
  const output: string[] = [];
  const errors: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const exitCode = Deno.exitCode;
  using _restore = {
    [Symbol.dispose]() {
      console.log = originalLog;
      console.error = originalError;
      Deno.exitCode = exitCode;
    },
  };
  console.log = function (message) {
    output.push(String(message));
  };
  console.error = function (message) {
    errors.push(String(message));
  };
  const root = join(dir.path, "fixtures");
  await main(["prepare", join(dir.path, "run")], {
    root,
    input,
    keyFromFile: function () {
      return key;
    },
  });
  expect(Deno.exitCode).toBe(1);
  expect(output).toEqual([]);
  expect(errors[0]).toContain("(sensitive-data)");
  expect(output.join("") + errors.join("")).not.toContain(key);
  expect(existsSync(root)).toBe(false);
});
