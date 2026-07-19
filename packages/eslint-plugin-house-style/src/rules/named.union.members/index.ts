// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "inlineUnionMember";

const namedUnionMembers = createRule<[], MessageIds>({
  name: "named-union-members",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Union members must be named types (discriminator via a *.enum where applicable), never inline object literals.",
    },
    schema: [],
    messages: {
      inlineUnionMember:
        "Inline object literal in a union. Extract it into its own named `type` (discriminated by an enum, per house style) and reference it in the union.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSUnionType(node: TSESTree.TSUnionType): void {
        for (const member of node.types) {
          if (member.type === "TSTypeLiteral" && member.members.length > 0) {
            context.report({ node: member, messageId: "inlineUnionMember" });
          }
        }
      },
    };
  },
});

export default namedUnionMembers;
