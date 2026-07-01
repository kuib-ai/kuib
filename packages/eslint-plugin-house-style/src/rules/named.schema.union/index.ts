// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "inlineSchema";

const isZodMethod = function (
  node: TSESTree.Expression,
  method: string,
): boolean {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "z" &&
    node.property.type === "Identifier" &&
    node.property.name === method
  );
};

const namedSchemaUnion = createRule<[], MessageIds>({
  name: "named-schema-union",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Zod union members must be named schemas (compose via base.extend), never an inline z.object() literal.",
    },
    schema: [],
    messages: {
      inlineSchema:
        "Inline z.object() as a union member. Extract it into its own named schema (base.extend, discriminated by an enum literal) and reference it in the union.",
    },
  },
  defaultOptions: [],
  create(context) {
    const checkArray = function (
      array: TSESTree.CallExpressionArgument | undefined,
    ): void {
      if (array === undefined || array.type !== "ArrayExpression") {
        return;
      }
      for (const element of array.elements) {
        if (
          element !== null &&
          element.type === "CallExpression" &&
          isZodMethod(element.callee, "object")
        ) {
          context.report({ node: element, messageId: "inlineSchema" });
        }
      }
    };
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (isZodMethod(node.callee, "union")) {
          checkArray(node.arguments[0]);
        }
        if (isZodMethod(node.callee, "discriminatedUnion")) {
          checkArray(node.arguments[1]);
        }
      },
    };
  },
});

export default namedSchemaUnion;
