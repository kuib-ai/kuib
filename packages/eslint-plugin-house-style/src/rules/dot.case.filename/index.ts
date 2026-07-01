// @context @journal/house-style-linting
import { ESLintUtils } from "@typescript-eslint/utils";
import * as path from "node:path";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "badDirectory" | "badFilename";

const DOT_CASE = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

const isExemptSegment = function (segment: string): boolean {
  return (
    segment.startsWith("@") ||
    (segment.startsWith("[") && segment.endsWith("]"))
  );
};

const fileStem = function (filename: string): string {
  return path.basename(filename).replace(/\.(ts|tsx)$/, "");
};

const segmentsUnderSrc = function (filename: string): {
  dirs: string[];
  file: string;
} {
  const marker = `${path.sep}src${path.sep}`;
  const index = filename.lastIndexOf(marker);
  const file = fileStem(filename);

  if (index < 0) {
    return { dirs: [], file };
  }

  const parts = filename.slice(index + marker.length).split(path.sep);
  return { dirs: parts.slice(0, -1), file };
};

const dotCaseFilename = createRule<[], MessageIds>({
  name: "dot-case-filename",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require directories and filenames to use dot.case (one unit per dot.case directory as index.ts).",
    },
    schema: [],
    messages: {
      badDirectory:
        "Directory segment '{{ segment }}' is not dot.case. Use lowercase words separated by dots.",
      badFilename:
        "Filename '{{ name }}' is not dot.case. Use lowercase words separated by dots.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      "Program:exit"(node) {
        const { dirs, file } = segmentsUnderSrc(context.filename);

        for (const segment of dirs) {
          if (isExemptSegment(segment)) {
            continue;
          }
          if (!DOT_CASE.test(segment)) {
            context.report({
              node,
              messageId: "badDirectory",
              data: { segment },
            });
          }
        }

        if (!DOT_CASE.test(file)) {
          context.report({
            node,
            messageId: "badFilename",
            data: { name: path.basename(context.filename) },
          });
        }
      },
    };
  },
});

export default dotCaseFilename;
