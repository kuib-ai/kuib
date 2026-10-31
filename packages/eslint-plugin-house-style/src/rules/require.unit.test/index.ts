// @claim infra/house-structure-rules
import { ESLintUtils } from "@typescript-eslint/utils";
import { parse } from "@typescript-eslint/parser";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import untestedUnits from "../../untested.units/index.ts";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type Options = {
  workspaceRoot?: string;
  allowlist?: string[];
  listFile?: string;
};

const BEHAVIOUR = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "ClassDeclaration",
  "ClassExpression",
]);

const hasBehaviour = function (value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(hasBehaviour);
  }
  const node = value as Record<string, unknown>;
  if (typeof node.type === "string" && BEHAVIOUR.has(node.type)) {
    return true;
  }
  return Object.entries(node).some(function ([key, child]) {
    return key !== "parent" && hasBehaviour(child);
  });
};

const hasTest = function (filename: string): boolean {
  const stem = filename.replace(/\.tsx?$/, "");
  return [".test.ts", ".test.tsx", ".live.test.ts", ".live.test.tsx"].some(
    function (suffix) {
      return existsSync(`${stem}${suffix}`);
    },
  );
};

const workspaceRoot = function (filename: string): string {
  let folder = dirname(filename);
  while (folder !== dirname(folder)) {
    if (existsSync(join(folder, "pnpm-workspace.yaml"))) {
      return folder;
    }
    folder = dirname(folder);
  }
  return process.cwd();
};

// @claim infra/house-structure-rules
const requireUnitTest = createRule<[Options], "missingTest" | "staleEntry">({
  name: "require-unit-test",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a sibling test for modules containing behaviour and reject stale allowlist entries.",
    },
    schema: [
      {
        type: "object",
        properties: {
          workspaceRoot: { type: "string" },
          allowlist: { type: "array", items: { type: "string" } },
          listFile: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTest:
        "{{ path }} contains behaviour and needs a sibling .test.ts(x) or .live.test.ts(x).",
      staleEntry:
        "Remove {{ path }} from the untested units: the file is missing, has a test, or contains no behaviour.",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const root = options.workspaceRoot ?? workspaceRoot(context.filename);
    const allowlist = options.allowlist ?? untestedUnits;
    const listFile =
      options.listFile ??
      "packages/eslint-plugin-house-style/src/untested.units/index.ts";
    const path = relative(root, context.filename);
    if (path === listFile) {
      return {
        Literal(node) {
          if (typeof node.value !== "string") {
            return;
          }
          const file = join(root, node.value);
          if (
            existsSync(file) &&
            !hasTest(file) &&
            hasBehaviour(parse(readFileSync(file, "utf8")))
          ) {
            return;
          }
          context.report({
            node,
            messageId: "staleEntry",
            data: { path: node.value },
          });
        },
      };
    }
    if (/\.(test|bench|d)\.tsx?$/.test(basename(path))) {
      return {};
    }
    return {
      "Program:exit"(node) {
        if (
          !hasBehaviour(node) ||
          hasTest(context.filename) ||
          allowlist.includes(path)
        ) {
          return;
        }
        context.report({ node, messageId: "missingTest", data: { path } });
      },
    };
  },
});

export default requireUnitTest;
