import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "node_modules",
    ".next",
    "build",
    "src/shared/ui/shadcn",
    // Generated / tool output
    "coverage",
    "playwright-report",
    "test-results",
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
  {
    // Feature-Sliced Design layer boundaries
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      "boundaries/include": ["src/**/*.{ts,tsx}"],
      "boundaries/elements": [
        { type: "app", pattern: "src/main.tsx", mode: "file" },
        { type: "app", pattern: "src/app", mode: "folder" },
        { type: "pages", pattern: "src/pages/*", mode: "file" },
        { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
        // features/websocket has no domain grouping, unlike every other feature slice;
        // it must be matched before the generic two-level pattern below
        {
          type: "features",
          pattern: "src/features/websocket",
          capture: ["slice"],
        },
        {
          type: "features",
          pattern: "src/features/*/*",
          capture: ["domain", "slice"],
        },
        { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared/*", capture: ["slice"] },
      ],
    },
    rules: {
      // Layers may only depend on themselves and layers below them; sibling slices within
      // widgets/features/entities may not import each other (push shared logic down instead)
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: [
                { to: { type: "app" } },
                { to: { type: "pages" } },
                { to: { type: "widgets" } },
                { to: { type: "features" } },
                { to: { type: "entities" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "pages" },
              allow: [
                { to: { type: "widgets" } },
                { to: { type: "features" } },
                { to: { type: "entities" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "widgets" },
              allow: [
                { to: { type: "features" } },
                { to: { type: "entities" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "features" },
              allow: [{ to: { type: "entities" } }, { to: { type: "shared" } }],
            },
            {
              from: { type: "entities" },
              allow: [{ to: { type: "shared" } }],
            },
            {
              from: { type: "shared" },
              allow: [{ to: { type: "shared" } }],
            },
            // Slices are only reachable through their public index.ts barrel, never by deep
            // import. Same-slice internal imports are unaffected: boundaries/dependencies
            // ignores dependencies within the same element by default (checkInternals: false).
            {
              to: {
                type: ["widgets", "features", "entities"],
                internalPath: "!index.ts",
              },
              disallow: [{ from: { type: "*" } }],
            },
          ],
        },
      ],
    },
  },
  {
    // Playwright e2e specs are not React; disable the React-specific rules.
    // (The `use` fixture param trips react-hooks/rules-of-hooks otherwise.)
    // Placed last so it overrides the shared rules above for these files.
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Colocated tests import the module they cover, which for a page means a
    // pages -> pages import. The layer rules describe the runtime dependency
    // graph, and a test is not part of it, so exempt specs only. Production
    // source is still fully constrained.
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "boundaries/dependencies": "off",
    },
  },
]);
