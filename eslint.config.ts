import jseslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import houseStylePlugin from "./packages/eslint-plugin-house-style/src/index.ts";

export default defineConfig(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.nx/**"],
  },
  jseslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    ignores: ["packages/eslint-plugin-house-style/**"],
    plugins: {
      house: houseStylePlugin,
    },
    rules: {
      "house/require-context-link": "warn",
      "house/dot-case-filename": "warn",
      "house/no-top-level-arrow": "warn",
      "house/named-exports-are-types": "warn",
      "house/no-prose-comments": "warn",
      "house/no-destructure-props": "warn",
      "func-style": ["warn", "expression"],
      eqeqeq: ["warn", "always"],
      "no-labels": "off",
      "no-restricted-syntax": [
        "warn",
        {
          selector: "TryStatement",
          message:
            "Do not use try/catch. Handle errors explicitly via the async tuple helper. Override with eslint-disable if unavoidable.",
        },
      ],
    },
  },
);
