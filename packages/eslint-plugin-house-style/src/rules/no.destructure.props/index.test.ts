import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

ruleTester.run("no-destructure-props", rule, {
  valid: [
    {
      code: "function helper({ a }: { a: number }) { return a; }",
      filename: "helper.tsx",
    },
    {
      code: "function Component(props: { a: number }) { return <div />; }",
      filename: "Component.tsx",
    },
    {
      code: "function Component({ a }: { a: number }) { return a; }",
      filename: "Component.ts",
    },
  ],
  invalid: [
    {
      code: "function Component({ a }: { a: number }) { return <div />; }",
      filename: "Component.tsx",
      errors: [{ messageId: "noDestructure" }],
    },
    {
      code: "function Component({ a }: { a: number }) { if (a) { return <>ok</>; } return null; }",
      filename: "Component.tsx",
      errors: [{ messageId: "noDestructure" }],
    },
    {
      code: "const Component = ({ a }: { a: number }) => <div />;",
      filename: "Component.tsx",
      errors: [{ messageId: "noDestructure" }],
    },
  ],
});
