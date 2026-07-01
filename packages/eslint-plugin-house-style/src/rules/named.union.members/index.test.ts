import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("named-union-members", rule, {
  valid: ["type T = Foo | Bar;", "type T = Foo | {};"],
  invalid: [
    {
      code: "type T = Named | { a: number };",
      errors: [{ messageId: "inlineUnionMember" }],
    },
  ],
});
