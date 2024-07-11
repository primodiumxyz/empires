import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
  ignores: ["**/dist/**", "**/build/**", "**/vite.config.ts"],
  languageOptions: {
    parserOptions: {
      project: ["./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
    },
  },
});
