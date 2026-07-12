import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("named-exports-are-types", rule, {
  valid: [
    "export type T = number;",
    "export interface I { a: number }",
    "export enum E { A }",
    "export namespace N {}",
    "export type { foo };",
  ],
  invalid: [
    {
      code: "export const x = 1;",
      errors: [{ messageId: "mustBeDefault" }],
    },
    {
      code: "export function f() {}",
      errors: [{ messageId: "mustBeDefault" }],
    },
    {
      code: "const v = 1; export { v };",
      errors: [{ messageId: "mustBeDefault" }],
    },
  ],
});
