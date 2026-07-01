import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, expect, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-cross-package-relative", rule, {
  valid: [
    {
      code: "import { baz } from '../bar/baz';",
      filename: "/repo/packages/engine/src/foo/index.ts",
    },
    {
      code: "import Protocol from '@kuib-ai/protocol';",
      filename: "/repo/packages/engine/src/foo/index.ts",
    },
    {
      code: "import { x } from '../packages/protocol/x';",
      filename: "/repo/scripts/tooling.ts",
    },
  ],
  invalid: [
    {
      code: "import { thing } from '../../../protocol/src/thing';",
      filename: "/repo/packages/engine/src/foo/index.ts",
      errors: [{ messageId: "crossPackage" }],
    },
  ],
});

describe("no-cross-package-relative message", () => {
  it("names the escaped package boundary", () => {
    expect(rule.meta.messages.crossPackage).toContain("escapes package");
  });
});
