// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "elseBranch" | "elseIfChain";

const preferGuardClauses = createRule<[], MessageIds>({
  name: "prefer-guard-clauses",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `else` branches. Invert the condition into a guard clause (early return/continue/throw); dispatch on a discriminant with `switch`.",
    },
    schema: [],
    messages: {
      elseBranch:
        "Use a guard clause (early return/continue/throw) instead of `else`. Override with eslint-disable if genuinely unavoidable.",
      elseIfChain:
        "Use `switch` on the discriminant (or guard clauses) instead of an `else if` chain. Override with eslint-disable if genuinely unavoidable.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      IfStatement(node: TSESTree.IfStatement) {
        if (node.alternate === null) {
          return;
        }
        const parent = node.parent;
        if (parent.type === "IfStatement" && parent.alternate === node) {
          return;
        }
        const messageId =
          node.alternate.type === "IfStatement" ? "elseIfChain" : "elseBranch";
        context.report({ node: node.alternate, messageId });
      },
    };
  },
});

export default preferGuardClauses;
