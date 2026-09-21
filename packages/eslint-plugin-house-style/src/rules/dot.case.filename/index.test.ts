import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "@std/testing/bdd";
import rule from "./index.ts";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("dot-case-filename", rule, {
  valid: [
    {
      code: "const x = 1;\n",
      filename: "/repo/src/memory.event.log/index.ts",
    },
    {
      code: "const x = 1;\n",
      filename: "/repo/src/@kuib-ai/[id]/index.ts",
    },
    {
      code: "const x = 1;\n",
      filename: "/repo/lib/WhateverDir/whatever.ts",
    },
  ],
  invalid: [
    {
      code: "const x = 1;\n",
      filename: "/repo/src/BadDir/index.ts",
      errors: [{ messageId: "badDirectory" }],
    },
    {
      code: "const x = 1;\n",
      filename: "/repo/src/good.dir/BadFile.ts",
      errors: [{ messageId: "badFilename" }],
    },
  ],
});
