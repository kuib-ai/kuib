import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-arrow", rule, {
  valid: [
    "const outer = function () {\n  return [1].map(function (x) {\n    return x + 1;\n  });\n};\n",
    'const obj = {\n  readFile: async function () {\n    return { content: "" };\n  },\n  async readDir() {\n    return { content: "" };\n  },\n};\n',
  ],
  invalid: [
    {
      code: "const foo = () => 1;\n",
      output: "const foo = function () { return 1; };\n",
      errors: [{ messageId: "noArrow" }],
    },
    {
      code: "export default () => 1;\n",
      output: "export default (function () { return 1; });\n",
      errors: [{ messageId: "noArrow" }],
    },
    {
      code: "const outer = function () {\n  return [1].map((x) => x + 1);\n};\n",
      output:
        "const outer = function () {\n  return [1].map(function (x) { return x + 1; });\n};\n",
      errors: [{ messageId: "noArrow" }],
    },
    {
      code: 'const obj = { readFile: async () => ({ content: "" }) };\n',
      output:
        'const obj = { readFile: async function () { return { content: "" }; } };\n',
      errors: [{ messageId: "noArrow" }],
    },
  ],
});
