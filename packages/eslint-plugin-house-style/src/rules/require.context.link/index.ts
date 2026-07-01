// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import * as fs from "node:fs";
import * as path from "node:path";

const STALE_ADR_MARKER = "{{FEATURE_NAME}}";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`,
);

type MessageIds = "missingContext" | "deadContextLink" | "staleContextLink";

const extractContextPath = function (
  comments: readonly TSESTree.Comment[],
): string | null {
  for (const comment of comments) {
    const match = comment.value.match(/@context\s+(\S+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
};

const findJournalRoot = function (startFile: string): string | null {
  let currentDir = path.dirname(startFile);

  while (currentDir !== path.dirname(currentDir)) {
    const candidate = path.join(currentDir, "journal");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
};

const resolveContextFile = function (
  contextPath: string,
  currentFilename: string,
): { absolutePath: string; exists: boolean } {
  if (contextPath.startsWith("@journal/")) {
    const journalRoot = findJournalRoot(currentFilename);

    if (journalRoot !== null) {
      const relative = contextPath.replace("@journal/", "");
      const base = path.join(journalRoot, relative);

      if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
        const target = path.join(base, "decisions.md");
        return { absolutePath: target, exists: fs.existsSync(target) };
      }

      if (fs.existsSync(`${base}.md`)) {
        return { absolutePath: `${base}.md`, exists: true };
      }

      return { absolutePath: base, exists: fs.existsSync(base) };
    }
  }

  const absolutePath = path.resolve(path.dirname(currentFilename), contextPath);
  return { absolutePath, exists: fs.existsSync(absolutePath) };
};

const isStaleAdr = function (absolutePath: string): boolean {
  return fs.readFileSync(absolutePath, "utf-8").includes(STALE_ADR_MARKER);
};

const requireContextLink = createRule<[], MessageIds>({
  name: "require-context-link",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require one @context link to a journal decision per module file.",
    },
    schema: [],
    messages: {
      missingContext:
        "Missing @context link. Add `@context @journal/<entry>` linking this module to its journal decision.",
      deadContextLink:
        "Dead context link. The journal entry '{{ contextPath }}' does not exist at {{ absolutePath }}.",
      staleContextLink:
        "Stale context link. The ADR at '{{ contextPath }}' still contains placeholder text and has not been filled in.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      "Program:exit"(node) {
        const contextPath = extractContextPath(
          context.sourceCode.getAllComments(),
        );

        if (contextPath === null) {
          context.report({ node, messageId: "missingContext" });
          return;
        }

        const { exists, absolutePath } = resolveContextFile(
          contextPath,
          context.filename,
        );

        if (!exists) {
          context.report({
            node,
            messageId: "deadContextLink",
            data: { contextPath, absolutePath },
          });
          return;
        }

        if (isStaleAdr(absolutePath)) {
          context.report({
            node,
            messageId: "staleContextLink",
            data: { contextPath },
          });
        }
      },
    };
  },
});

export default requireContextLink;
