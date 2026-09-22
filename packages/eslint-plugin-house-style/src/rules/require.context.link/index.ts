// @context @journal/domains/infra#^C004
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import * as fs from "node:fs";
import * as path from "node:path";

const STALE_ADR_MARKER = "{{FEATURE_NAME}}";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds =
  | "missingContext"
  | "deadContextLink"
  | "deadContextAnchor"
  | "staleContextLink";

const DIRECTORY_ENTRY_FILES = ["current.md", "plan.md", "decisions.md"];

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
        const entryFile = DIRECTORY_ENTRY_FILES.find(function (file) {
          return fs.existsSync(path.join(base, file));
        });
        const target = path.join(base, entryFile ?? DIRECTORY_ENTRY_FILES[0]);
        return { absolutePath: target, exists: entryFile !== undefined };
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

const splitAnchor = function (contextPath: string): {
  target: string;
  anchor: string | null;
} {
  const match = contextPath.match(/^(.*)#\^([A-Za-z0-9-]+)$/);
  if (match === null) {
    return { target: contextPath, anchor: null };
  }
  return { target: match[1], anchor: match[2] };
};

const hasBlockAnchor = function (
  absolutePath: string,
  anchor: string,
): boolean {
  const pattern = new RegExp(`(^|\\s)\\^${anchor}\\s*$`, "m");
  return pattern.test(fs.readFileSync(absolutePath, "utf-8"));
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
        "Require one @context link to a journal domain, claim, or entry per module file.",
    },
    schema: [],
    messages: {
      missingContext:
        "Missing @context link. Add `@context @journal/domains/<domain>` (optionally `#^C###`) linking this module to its journal context.",
      deadContextLink:
        "Dead context link. The journal entry '{{ contextPath }}' does not exist at {{ absolutePath }}.",
      deadContextAnchor:
        "Dead context anchor. '{{ contextPath }}' names block ^{{ anchor }}, which is not in {{ absolutePath }}.",
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

        const { target, anchor } = splitAnchor(contextPath);
        const { exists, absolutePath } = resolveContextFile(
          target,
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

        if (anchor !== null && !hasBlockAnchor(absolutePath, anchor)) {
          context.report({
            node,
            messageId: "deadContextAnchor",
            data: { contextPath, absolutePath, anchor },
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
