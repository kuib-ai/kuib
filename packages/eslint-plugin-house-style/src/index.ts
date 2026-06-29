import requireContextLink from "./rules/require.context.link/index.js";
import dotCaseFilename from "./rules/dot.case.filename/index.js";
import noTopLevelArrow from "./rules/no.top.level.arrow/index.js";
import namedExportsAreTypes from "./rules/named.exports.are.types/index.js";
import noProseComments from "./rules/no.prose.comments/index.js";
import noDestructureProps from "./rules/no.destructure.props/index.js";

const houseStylePlugin = {
  rules: {
    "require-context-link": requireContextLink,
    "dot-case-filename": dotCaseFilename,
    "no-top-level-arrow": noTopLevelArrow,
    "named-exports-are-types": namedExportsAreTypes,
    "no-prose-comments": noProseComments,
    "no-destructure-props": noDestructureProps,
  },
};

export default houseStylePlugin;
