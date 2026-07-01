import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-prose-comments", rule, {
  valid: [
    "// @context @journal/foo\nconst x = 1;\n",
    "// eslint-disable no-console\nconst x = 1;\n",
    "// eslint-enable\nconst x = 1;\n",
    "// eslint no-unused-vars: off\nconst x = 1;\n",
    "// global window\nconst x = 1;\n",
    "// @ts-expect-error\nconst x = 1;\n",
  ],
  invalid: [
    {
      code: "// this explains the code\nconst x = 1;\n",
      errors: [{ messageId: "noComments" }],
    },
    {
      code: "// @ts-ignore\n// just a note\nconst x = 1;\n",
      errors: [{ messageId: "noComments" }],
    },
  ],
});
