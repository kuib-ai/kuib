import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "noArrow";

const noTopLevelArrow = createRule<[], MessageIds>({
  name: "no-top-level-arrow",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Top-level units must be const function expressions, not arrows. Pairs with func-style for declarations.",
    },
    schema: [],
    messages: {
      noArrow:
        "Top-level arrow units are not allowed. Use `const {{ name }} = function (...) {}` (generics: `function <T>`).",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        const parent = node.parent;

        if (parent.type === "ExportDefaultDeclaration") {
          context.report({
            node,
            messageId: "noArrow",
            data: { name: "unit" },
          });
          return;
        }

        if (parent.type === "VariableDeclarator") {
          const grandparent = parent.parent.parent;
          if (
            grandparent.type === "Program" ||
            grandparent.type === "ExportNamedDeclaration"
          ) {
            const name =
              parent.id.type === "Identifier" ? parent.id.name : "unit";
            context.report({ node, messageId: "noArrow", data: { name } });
          }
        }
      },
    };
  },
});

export default noTopLevelArrow;
