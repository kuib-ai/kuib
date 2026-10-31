import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "@std/testing/bdd";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import rule from "./index.ts";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const root = mkdtempSync(join(tmpdir(), "require-unit-test-"));
afterAll(function () {
  rmSync(root, { recursive: true, force: true });
});

const unit = function (name: string, code: string, test?: string): string {
  const folder = join(root, name);
  mkdirSync(folder);
  const filename = join(folder, "index.ts");
  writeFileSync(filename, code);
  if (test !== undefined) {
    writeFileSync(join(folder, test), "");
  }
  return filename;
};

const behaviour = "export default function run() { return 1; }";
const tested = unit("tested", behaviour, "index.test.ts");
const live = unit("live", behaviour, "index.live.test.tsx");
const missing = unit("missing", behaviour);
const exempt = unit("exempt", behaviour);
const schema = unit("schema", "export default { value: 1 };");
const listFile = "list.ts";
const options = {
  workspaceRoot: root,
  allowlist: ["exempt/index.ts"],
  listFile,
};
const tester = new RuleTester();

tester.run("require-unit-test", rule, {
  valid: [
    { code: behaviour, filename: tested, options: [options] },
    { code: behaviour, filename: live, options: [options] },
    { code: behaviour, filename: exempt, options: [options] },
    {
      code: "type Value = { name: string };",
      filename: missing,
      options: [options],
    },
    {
      code: "enum Mode { TEST = 'test' }",
      filename: missing,
      options: [options],
    },
    {
      code: "const schema = z.object({ name: z.string() });",
      filename: missing,
      options: [options],
    },
    { code: "export default { run };", filename: missing, options: [options] },
    {
      code: behaviour,
      filename: join(root, "index.test.ts"),
      options: [options],
    },
    {
      code: behaviour,
      filename: join(root, "index.bench.ts"),
      options: [options],
    },
    {
      code: 'export default ["exempt/index.ts"];',
      filename: join(root, listFile),
      options: [options],
    },
  ],
  invalid: [
    {
      code: behaviour,
      filename: missing,
      options: [options],
      errors: [{ messageId: "missingTest" }],
    },
    {
      code: "const run = () => 1;",
      filename: missing,
      options: [options],
      errors: [{ messageId: "missingTest" }],
    },
    {
      code: "export class Runner {}",
      filename: missing,
      options: [options],
      errors: [{ messageId: "missingTest" }],
    },
    {
      code: behaviour,
      filename: exempt,
      options: [{ ...options, allowlist: [] }],
      errors: [{ messageId: "missingTest" }],
    },
    {
      code: 'export default ["gone/index.ts"];',
      filename: join(root, listFile),
      options: [options],
      errors: [{ messageId: "staleEntry", line: 1 }],
    },
    {
      code: 'export default ["tested/index.ts"];',
      filename: join(root, listFile),
      options: [options],
      errors: [{ messageId: "staleEntry", line: 1 }],
    },
    {
      code: `export default [${JSON.stringify(schema.slice(root.length + 1))}];`,
      filename: join(root, listFile),
      options: [options],
      errors: [{ messageId: "staleEntry", line: 1 }],
    },
  ],
});
