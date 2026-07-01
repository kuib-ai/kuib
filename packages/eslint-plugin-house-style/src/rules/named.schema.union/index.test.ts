import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("named-schema-union", rule, {
  valid: [
    "const S = z.union([Foo, Bar]);",
    "const S = z.union(Members); const T = z.union();",
  ],
  invalid: [
    {
      code: "const S = z.union([Named, z.object({ a: 1 })]);",
      errors: [{ messageId: "inlineSchema" }],
    },
    {
      code: 'const S = z.discriminatedUnion("kind", [Named, z.object({ b: 2 })]);',
      errors: [{ messageId: "inlineSchema" }],
    },
  ],
});
