import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "packages/event-log-sqlite/**",
      "packages/engine-service/**",
      "apps/host-tui/**",
    ],
    environment: "node",
  },
});
