// @context @journal/house-style-linting
import requireContextLink from "./rules/require.context.link/index.js";
import dotCaseFilename from "./rules/dot.case.filename/index.js";
import noTopLevelArrow from "./rules/no.top.level.arrow/index.js";
import namedExportsAreTypes from "./rules/named.exports.are.types/index.js";
import noProseComments from "./rules/no.prose.comments/index.js";
import noDestructureProps from "./rules/no.destructure.props/index.js";
import noCrossPackageRelative from "./rules/no.cross.package.relative/index.js";

const rules = {
  "require-context-link": requireContextLink,
  "dot-case-filename": dotCaseFilename,
  "no-top-level-arrow": noTopLevelArrow,
  "named-exports-are-types": namedExportsAreTypes,
  "no-prose-comments": noProseComments,
  "no-destructure-props": noDestructureProps,
  "no-cross-package-relative": noCrossPackageRelative,
};

const recommendedRules = {
  "house/require-context-link": "error",
  "house/dot-case-filename": "error",
  "house/no-top-level-arrow": "error",
  "house/named-exports-are-types": "error",
  "house/no-prose-comments": "error",
  "house/no-destructure-props": "error",
  "house/no-cross-package-relative": "error",
  "func-style": ["error", "expression"],
  eqeqeq: ["error", "always"],
  "no-labels": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@kuib-ai/protocol/*"],
          allowTypeImports: true,
          message:
            "Import values from the @kuib-ai/protocol namespace (e.g. Protocol.ID.SessionID); only types may come from subpaths.",
        },
      ],
    },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector: "TryStatement",
      message:
        "Do not use try/catch. Handle errors explicitly via the async tuple helper. Override with eslint-disable if unavoidable.",
    },
  ],
};

const houseStylePlugin = {
  meta: { name: "eslint-plugin-house-style" },
  rules,
  configs: {
    recommended: {
      rules: recommendedRules,
    },
  },
};

export default houseStylePlugin;
