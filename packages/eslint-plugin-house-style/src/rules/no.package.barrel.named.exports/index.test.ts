import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-package-barrel-named-exports", rule, {
  valid: [
    {
      code: "const Cli = {}; export default Cli;",
      filename: "/repo/packages/cli/src/index.ts",
    },
    {
      code: "export type CliSchema = { description: string };",
      filename: "/repo/packages/cli/src/cli.schema/index.ts",
    },
  ],
  invalid: [
    {
      code: "export default {}; export type { Foo };",
      filename: "/repo/packages/cli/src/index.ts",
      errors: [{ messageId: "noNamedExport" }],
    },
    {
      code: "export type { ToolSpec } from './tool.spec';",
      filename: "/repo/packages/tools/src/index.ts",
      errors: [{ messageId: "noNamedExport" }],
    },
    {
      code: "export * from './x';",
      filename: "/repo/packages/std/src/index.ts",
      errors: [{ messageId: "noNamedExport" }],
    },
  ],
});
