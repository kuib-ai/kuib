// @claim infra/code-links
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import * as fs from "node:fs";
import * as path from "node:path";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "missingClaim" | "badTarget" | "deadDomain" | "deadClaim";

const CLAIM_LINK = /^\s*@claim\s+(.+?)\s*$/;
const LINK_TARGET = /^([a-z]+)(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?$/;

const claimTargets = function (comment: TSESTree.Comment): string[] | null {
  const match = comment.value.match(CLAIM_LINK);
  return match ? match[1].split(/[\s,]+/).filter(Boolean) : null;
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

const hasClaim = function (currentPath: string, claim: string): boolean {
  const pattern = new RegExp(`(^|\\s)\\^${claim}\\s*$`, "m");
  return pattern.test(fs.readFileSync(currentPath, "utf-8"));
};

const requireContextLink = createRule<[], MessageIds>({
  name: "require-context-link",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a first-line `@claim <domain>[/<claim>]` link, and every @claim link to resolve to a journal domain claim.",
    },
    schema: [],
    messages: {
      missingClaim:
        "Missing file link. Start the module with `// @claim <domain>[/<claim>]` naming the claim (or domain) that explains it.",
      badTarget:
        "`@claim {{ target }}` must be <domain>/<claim>; a domain alone is allowed only in the first-line file link.",
      deadDomain:
        "`@claim {{ target }}`: journal/domains/{{ domain }}/current.md does not exist.",
      deadClaim:
        "`@claim {{ target }}`: no claim ^{{ claim }} in journal/domains/{{ domain }}/current.md.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      "Program:exit"(node) {
        const comments = context.sourceCode.getAllComments();
        const first = comments.find(function (comment) {
          return comment.loc.start.line === 1;
        });
        if (!first || claimTargets(first) === null) {
          context.report({ node, messageId: "missingClaim" });
        }
        const journal = findJournalRoot(context.filename);
        if (journal === null) {
          return;
        }
        for (const comment of comments) {
          const targets = claimTargets(comment);
          if (targets === null) {
            continue;
          }
          for (const target of targets) {
            const match = target.match(LINK_TARGET);
            if (match === null || (comment !== first && !match[2])) {
              context.report({
                loc: comment.loc,
                messageId: "badTarget",
                data: { target },
              });
              continue;
            }
            const [, domain, claim] = match;
            const currentPath = path.join(
              journal,
              "domains",
              domain,
              "current.md",
            );
            if (!fs.existsSync(currentPath)) {
              context.report({
                loc: comment.loc,
                messageId: "deadDomain",
                data: { target, domain },
              });
              continue;
            }
            if (claim && !hasClaim(currentPath, claim)) {
              context.report({
                loc: comment.loc,
                messageId: "deadClaim",
                data: { target, domain, claim },
              });
            }
          }
        }
      },
    };
  },
});

export default requireContextLink;
