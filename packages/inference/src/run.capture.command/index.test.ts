import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import main from "./index.ts";
import { join } from "node:path";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";

it("prints CLI help without reading keys or requesting filesystem/network permissions", async function () {
  const lines: string[] = [];
  const original = console.log;
  using _restore = {
    [Symbol.dispose]() {
      console.log = original;
    },
  };
  console.log = function (value) {
    lines.push(String(value));
  };
  await main(["--help"]);
  expect(lines[0]).toContain("Usage: inference");
  expect(Deno.exitCode).toBe(0);
});

Deno.test({
  name: "public capture command prints help without credential or network grants",
  fn: async function () {
    const binary = join(
      ResolveCaptureRootUnit.ROOT,
      "packages",
      "inference",
      "bin",
      "inference",
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: ["run", "--no-check", binary, "--help"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    expect(output.code).toBe(0);
    expect(new TextDecoder().decode(output.stdout)).toContain(
      "Usage: inference prepare",
    );
    expect(new TextDecoder().decode(output.stderr)).toBe("");
  },
});

it("maps a denied child spawn to a sanitized launcher refusal", async function () {
  const root = ResolveCaptureRootUnit.ROOT;
  const binary = join(root, "packages", "inference", "bin", "inference");
  const output = await new Deno.Command(Deno.execPath(), {
    args: ["run", "--no-check", "--no-prompt", "--allow-read", binary, "audit"],
    cwd: root,
    stdout: "piped",
    stderr: "piped",
  }).output();
  expect(output.code).toBe(1);
  expect(new TextDecoder().decode(output.stderr)).toContain(
    "capture refused (permission-denied)",
  );
});
