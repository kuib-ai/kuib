// @context @journal/house-style-linting
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "namedFromRoot";

const PACKAGE_ROOT = /^@kuib-ai\/[^/]+$/;

const noNamedImportFromPackageRoot = createRule<[], MessageIds>({
  name: "no-named-import-from-package-root",
  meta: {
    type: "problem",
    docs: {
      description:
        "Import package roots as the default namespace only. Named/type imports must use a section subpath.",
    },
    schema: [],
    messages: {
      namedFromRoot:
        "Do not named-import from '{{ source }}'. Use `import Pkg from '{{ source }}'` for values, or `import type { … } from '{{ source }}/<section>'` for types.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || !PACKAGE_ROOT.test(source)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportDefaultSpecifier") {
            continue;
          }
          context.report({
            node: specifier,
            messageId: "namedFromRoot",
            data: { source },
          });
        }
      },
    };
  },
});

export default noNamedImportFromPackageRoot;
