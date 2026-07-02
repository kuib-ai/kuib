import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("prefer-guard-clauses", rule, {
  valid: [
    "const f = function (x: number) {\n  if (x < 0) {\n    return 0;\n  }\n  return x;\n};\n",
    "const g = function (kind: string) {\n  switch (kind) {\n    case 'a':\n      return 1;\n    default:\n      return 0;\n  }\n};\n",
  ],
  invalid: [
    {
      code: "const f = function (x: number) {\n  if (x < 0) {\n    return 0;\n  } else {\n    return x;\n  }\n};\n",
      errors: [{ messageId: "elseBranch" }],
    },
    {
      code: "const f = function (k: string) {\n  if (k === 'a') {\n    return 1;\n  } else if (k === 'b') {\n    return 2;\n  } else {\n    return 0;\n  }\n};\n",
      errors: [{ messageId: "elseIfChain" }],
    },
  ],
});
