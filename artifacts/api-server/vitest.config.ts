import { defineConfig } from "vitest/config";

// Local config so Vitest does not pick up the repository-root Vite config.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
