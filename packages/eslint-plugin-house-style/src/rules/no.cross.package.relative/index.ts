// @context @journal/house-style-linting
import * as path from "node:path";
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "crossPackage";

const WORKSPACE_DIRS = ["packages", "apps"];

const packageRootOf = function (absPath: string): string | null {
  const parts = absPath.split(path.sep);
  for (let i = parts.length - 1; i >= 1; i--) {
    if (WORKSPACE_DIRS.includes(parts[i - 1]!)) {
      return parts.slice(0, i + 1).join(path.sep);
    }
  }
  return null;
};

type SourcedNode =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration;

const noCrossPackageRelative = createRule<[], MessageIds>({
  name: "no-cross-package-relative",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow relative imports that cross a package boundary; import across packages via @kuib-ai/<package>.",
    },
    schema: [],
    messages: {
      crossPackage:
        "Relative import '{{ specifier }}' escapes package '{{ pkg }}'. Import across packages via @kuib-ai/<package>.",
    },
  },
  defaultOptions: [],
  create(context) {
    const check = function (node: SourcedNode): void {
      const source = node.source;
      if (source === null || typeof source.value !== "string") {
        return;
      }
      const specifier = source.value;
      if (!specifier.startsWith(".")) {
        return;
      }
      const fileRoot = packageRootOf(context.filename);
      if (fileRoot === null) {
        return;
      }
      const resolved = path.resolve(path.dirname(context.filename), specifier);
      const targetRoot = packageRootOf(resolved);
      if (targetRoot !== null && targetRoot !== fileRoot) {
        context.report({
          node: source,
          messageId: "crossPackage",
          data: { specifier, pkg: path.basename(fileRoot) },
        });
      }
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
});

export default noCrossPackageRelative;
