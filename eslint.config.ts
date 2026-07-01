import jseslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import houseStylePlugin from "./packages/eslint-plugin-house-style/src/index.ts";

export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.nx/**",
      ".references/**",
    ],
  },
  jseslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    plugins: {
      house: houseStylePlugin,
    },
    rules: houseStylePlugin.configs.recommended.rules,
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "house/require-context-link": "off",
      "house/named-exports-are-types": "off",
      "house/dot-case-filename": "off",
    },
  },
);
