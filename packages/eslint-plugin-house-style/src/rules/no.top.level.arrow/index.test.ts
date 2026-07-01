import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-top-level-arrow", rule, {
  valid: ["const outer = function () {\n  return [1].map((x) => x + 1);\n};\n"],
  invalid: [
    {
      code: "const foo = () => 1;\n",
      errors: [{ messageId: "noArrow", data: { name: "foo" } }],
    },
    {
      code: "export default () => 1;\n",
      errors: [{ messageId: "noArrow", data: { name: "unit" } }],
    },
  ],
});
