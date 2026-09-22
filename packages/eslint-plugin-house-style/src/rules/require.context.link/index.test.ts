import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "@std/testing/bdd";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import rule from "./index.ts";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const root = fs.mkdtempSync(path.join(os.tmpdir(), "require-context-link-"));

const setup = function (): void {
  const domain = path.join(root, "journal", "domains", "core");
  fs.mkdirSync(domain, { recursive: true });
  fs.writeFileSync(
    path.join(domain, "current.md"),
    "# Core\n\nThe engine runs the loop. ^engine-loop\n",
  );
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
};

setup();

const filename = path.join(root, "src", "mod.ts");

const ruleTester = new RuleTester();

ruleTester.run("require-context-link", rule, {
  valid: [
    {
      code: "// @claim core\nconst x = 1;\n",
      filename,
    },
    {
      code: "// @claim core/engine-loop\nconst x = 1;\n",
      filename,
    },
    {
      code: "// @claim core\n// @claim core/engine-loop\nconst x = 1;\n",
      filename,
    },
  ],
  invalid: [
    {
      code: "const x = 1;\n",
      filename,
      errors: [{ messageId: "missingClaim" }],
    },
    {
      code: "const y = 2;\n// @claim core\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "missingClaim" }, { messageId: "badTarget" }],
    },
    {
      code: "// @claim nope\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "deadDomain" }],
    },
    {
      code: "// @claim core/missing\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "deadClaim" }],
    },
    {
      code: "// @claim core\n// @claim core\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "badTarget" }],
    },
  ],
});
