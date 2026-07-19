// @context @journal/house-style-linting
import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "noNamedExport";

const isPackageBarrel = function (filename: string): boolean {
  const normalized = filename.replaceAll("\\", "/");
  return /\/(?:packages|apps)\/[^/]+\/src\/index\.tsx?$/.test(normalized);
};

const noPackageBarrelNamedExports = createRule<[], MessageIds>({
  name: "no-package-barrel-named-exports",
  meta: {
    type: "problem",
    docs: {
      description:
        "Package/app root barrels may only default-export a namespace object. Types and named values belong in section units.",
    },
    schema: [],
    messages: {
      noNamedExport:
        "Package barrel `src/index` may only `export default`. Export types from the section unit (e.g. `@kuib-ai/cli/cli.schema`).",
    },
  },
  defaultOptions: [],
  create(context) {
    if (!isPackageBarrel(context.filename)) {
      return {};
    }
    return {
      ExportNamedDeclaration(node) {
        context.report({ node, messageId: "noNamedExport" });
      },
      ExportAllDeclaration(node) {
        context.report({ node, messageId: "noNamedExport" });
      },
    };
  },
});

export default noPackageBarrelNamedExports;
