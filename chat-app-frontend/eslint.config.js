import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "node_modules",
    ".next",
    "build",
    "src/shared/ui/shadcn",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022, // Modernized for 2026 compilation runtimes
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // Production Grade Optimization Rule Blocks
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-debugger": "error",
      "no-unused-vars": "off", // Turned off in favor of the more accurate TypeScript compiler rule below

      // TypeScript Strict Integrity Rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Discourages typing errors with 'any' statements
      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-empty-object-type": "error",

      // React Operational Hook Rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Fast Refresh Compilation Enforcement
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
]);
