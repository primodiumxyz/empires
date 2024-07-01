import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    setupFiles: "./__tests__/lib/setupTests",
    // Default environment
    environment: "node",
    // Environment configuration based on file patterns
    environmentMatchGlobs: [
      // Use jsdom for any test files in the "browser-tests" folder
      ["**/browser/**", "happy-dom"],
      // Use jsdom for any test files with ".browser.test." in their name
      ["**/*.browser*", "happy-dom"],
    ],
    exclude: ["**/__tests__/lib/**", "**/node_modules/**"],
  },

  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "src") },
      { find: "@test", replacement: resolve(__dirname, "__tests__") },
    ],
  },
});
