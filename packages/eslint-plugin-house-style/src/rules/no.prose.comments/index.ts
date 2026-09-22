// @claim infra/house-style-rules
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "noComments";

// @claim infra/house-style-rules
const isAllowedComment = function (value: string): boolean {
  const trimmed = value.trim();
  return (
    /^@claim\s/.test(trimmed) ||
    /^eslint-disable/.test(trimmed) ||
    /^eslint-enable/.test(trimmed) ||
    /^eslint /.test(trimmed) ||
    /^global[s ]/.test(trimmed) ||
    /^@ts-/.test(trimmed)
  );
};

const noProseComments = createRule<[], MessageIds>({
  name: "no-prose-comments",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments except @claim links and eslint/ts tooling directives.",
    },
    schema: [],
    messages: {
      noComments:
        "Comments are not allowed except @claim links and eslint-disable/ts directives. Code should be self-explanatory.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      "Program:exit"() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isAllowedComment(comment.value)) {
            continue;
          }
          context.report({ loc: comment.loc, messageId: "noComments" });
        }
      },
    };
  },
});

export default noProseComments;
