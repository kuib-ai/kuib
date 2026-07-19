// @context @journal/house-style-linting
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(function (name) {
  return `https://github.com/kuib-ai/kuib/tree/main/docs/rules/${name}.md`;
});

type MessageIds = "noDestructure";

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const isJsx = function (node: TSESTree.Node | null | undefined): boolean {
  return !!node && (node.type === "JSXElement" || node.type === "JSXFragment");
};

const returnsJsx = function (fn: FunctionNode): boolean {
  const body = fn.body;

  if (body.type !== "BlockStatement") {
    return isJsx(body);
  }

  const stack: TSESTree.Node[] = [...body.body];

  const isNode = function (val: unknown): val is TSESTree.Node {
    return !!val && typeof (val as Record<string, unknown>).type === "string";
  };

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current.type !== "string") {
      continue;
    }

    if (current.type === "ReturnStatement") {
      if (isJsx(current.argument)) {
        return true;
      }
      continue;
    }

    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      continue;
    }

    for (const key of Object.keys(current) as (keyof TSESTree.Node)[]) {
      if (key === "parent") {
        continue;
      }
      const value = current[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (isNode(item)) {
            stack.push(item);
          }
        }
        continue;
      }
      if (isNode(value)) {
        stack.push(value);
      }
    }
  }

  return false;
};

const noDestructureProps = createRule<[], MessageIds>({
  name: "no-destructure-props",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow destructuring props in Solid components — it breaks reactivity. Accept `props` and read `props.x`.",
    },
    schema: [],
    messages: {
      noDestructure:
        "Do not destructure props in a Solid component — it breaks reactivity. Accept `props` and access fields as `props.x`.",
    },
  },
  defaultOptions: [],
  create(context) {
    if (!context.filename.endsWith(".tsx")) {
      return {};
    }

    const check = function (node: FunctionNode): void {
      const first = node.params[0];
      if (!first || first.type !== "ObjectPattern") {
        return;
      }
      if (!returnsJsx(node)) {
        return;
      }
      context.report({ node: first, messageId: "noDestructure" });
    };

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});

export default noDestructureProps;
