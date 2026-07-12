import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-named-import-from-package-root", rule, {
  valid: [
    "import Cli from '@kuib-ai/cli';",
    "import type { CliSchema } from '@kuib-ai/cli/cli.schema';",
    "import type { ToolSpec } from '@kuib-ai/tools/tool.spec';",
    "import createPinoLogger from '@kuib-ai/std/pino';",
  ],
  invalid: [
    {
      code: "import type { CliSchema } from '@kuib-ai/cli';",
      errors: [{ messageId: "namedFromRoot" }],
    },
    {
      code: "import { withError } from '@kuib-ai/std';",
      errors: [{ messageId: "namedFromRoot" }],
    },
    {
      code: "import Std, { type Logger } from '@kuib-ai/std';",
      errors: [{ messageId: "namedFromRoot" }],
    },
    {
      code: "import * as Std from '@kuib-ai/std';",
      errors: [{ messageId: "namedFromRoot" }],
    },
  ],
});
