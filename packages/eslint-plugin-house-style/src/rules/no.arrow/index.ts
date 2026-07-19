// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type { TSESLint } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "noArrow";

const needsParens = function (node: TSESTree.ArrowFunctionExpression): boolean {
  const parent = node.parent;
  if (parent.type === "CallExpression" && parent.callee === node) {
    return true;
  }
  if (parent.type === "NewExpression" && parent.callee === node) {
    return true;
  }
  if (parent.type === "MemberExpression" && parent.object === node) {
    return true;
  }
  if (parent.type === "TaggedTemplateExpression" && parent.tag === node) {
    return true;
  }
  if (parent.type === "ExportDefaultDeclaration") {
    return true;
  }
  return false;
};

const toFunctionExpression = function (
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.ArrowFunctionExpression,
): string {
  const asyncPrefix = node.async ? "async " : "";
  const typeParams = node.typeParameters
    ? sourceCode.getText(node.typeParameters)
    : "";
  const params = node.params
    .map(function (param) {
      return sourceCode.getText(param);
    })
    .join(", ");
  const returnType = node.returnType ? sourceCode.getText(node.returnType) : "";
  const body =
    node.body.type === "BlockStatement"
      ? sourceCode.getText(node.body)
      : `{ return ${sourceCode.getText(node.body)}; }`;
  const typeParamsText = typeParams === "" ? "" : ` ${typeParams}`;
  const expression = `${asyncPrefix}function${typeParamsText} (${params})${returnType} ${body}`;
  if (needsParens(node)) {
    return `(${expression})`;
  }
  return expression;
};

const noArrow = createRule<[], MessageIds>({
  name: "no-arrow",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Arrow functions are not allowed. Use function expressions. Pairs with func-style for declarations.",
    },
    fixable: "code",
    schema: [],
    messages: {
      noArrow:
        "Arrow functions are not allowed. Use `function (...) {}` (generics: `function <T>`).",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        context.report({
          node,
          messageId: "noArrow",
          fix(fixer) {
            return fixer.replaceText(
              node,
              toFunctionExpression(context.sourceCode, node),
            );
          },
        });
      },
    };
  },
});

export default noArrow;
