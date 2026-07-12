import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-re-exports", rule, {
  valid: [
    "export default Foo;",
    "export type { Foo };",
    "export type Foo = number;",
    "const x = 1; export { x };",
  ],
  invalid: [
    {
      code: "export type { AnyError } from './error.any';",
      errors: [{ messageId: "noReExport" }],
    },
    {
      code: "export { foo } from './x';",
      errors: [{ messageId: "noReExport" }],
    },
    {
      code: "export * from './x';",
      errors: [{ messageId: "noReExport" }],
    },
  ],
});
