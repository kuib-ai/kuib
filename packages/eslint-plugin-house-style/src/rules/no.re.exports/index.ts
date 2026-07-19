// @context @journal/house-style-linting
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "noReExport";

const noReExports = createRule<[], MessageIds>({
  name: "no-re-exports",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `export … from` / `export * from`. Import from the defining unit; barrels only default-export a namespace.",
    },
    schema: [],
    messages: {
      noReExport:
        "Re-exports are banned (`export … from`). Import the symbol from its defining unit instead (e.g. `@kuib-ai/protocol/error/error.any`).",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.source !== null) {
          context.report({ node, messageId: "noReExport" });
        }
      },
      ExportAllDeclaration(node) {
        context.report({ node, messageId: "noReExport" });
      },
    };
  },
});

export default noReExports;
