// @context @journal/house-style-linting
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "mustBeDefault";

const ALLOWED_KINDS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSEnumDeclaration",
  "TSModuleDeclaration",
]);

const namedExportsAreTypes = createRule<[], MessageIds>({
  name: "named-exports-are-types",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Named exports must be types or enums. Export the unit value as the default export.",
    },
    schema: [],
    messages: {
      mustBeDefault:
        "Named value exports are not allowed. Export the unit as `export default`; named exports must be types. Override with eslint-disable if intentional.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration === null) {
          if (node.exportKind === "type") {
            return;
          }

          for (const specifier of node.specifiers) {
            if (specifier.exportKind === "type") {
              continue;
            }
            context.report({ node: specifier, messageId: "mustBeDefault" });
          }
          return;
        }

        if (ALLOWED_KINDS.has(node.declaration.type)) {
          return;
        }

        context.report({ node: node.declaration, messageId: "mustBeDefault" });
      },
    };
  },
});

export default namedExportsAreTypes;
