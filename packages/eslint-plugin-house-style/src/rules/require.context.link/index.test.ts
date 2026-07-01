import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import rule from "./index.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const root = fs.mkdtempSync(path.join(os.tmpdir(), "require-context-link-"));

const setup = function (): void {
  const journal = path.join(root, "journal");
  fs.mkdirSync(path.join(journal, "entry"), { recursive: true });
  fs.writeFileSync(
    path.join(journal, "entry", "decisions.md"),
    "# entry\n{{FEATURE_NAME}} still a placeholder\n",
  );
  fs.writeFileSync(path.join(journal, "plain.md"), "# plain\nreal content\n");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
};

setup();

const filename = path.join(root, "src", "mod.ts");

const ruleTester = new RuleTester();

ruleTester.run("require-context-link", rule, {
  valid: [
    {
      code: "// @context @journal/plain\nconst x = 1;\n",
      filename,
    },
  ],
  invalid: [
    {
      code: "const x = 1;\n",
      filename,
      errors: [{ messageId: "missingContext" }],
    },
    {
      code: "// @context @journal/nope\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "deadContextLink" }],
    },
    {
      code: "// @context @journal/entry\nconst x = 1;\n",
      filename,
      errors: [{ messageId: "staleContextLink" }],
    },
  ],
});
