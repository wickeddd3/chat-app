import eslintjs from "@eslint/js";
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["node_modules", "dist", "prisma/generated"] },
  {
    files: ["**/*.ts"], // Apply these rules only to TypeScript files
    extends: [
      eslintjs.configs.recommended,
      ...tseslint.configs.strictTypeChecked, // Upgraded from recommended to strict typechecking
      ...tseslint.configs.stylisticTypeChecked, // Enforces consistent architecture styles
      nodePlugin.configs["flat/recommended"], // Handles Node.js scoped environment security boundaries
    ],
    languageOptions: {
      parserOptions: {
        projectService: true, // Natively scans workspace directories for tsconfig mapping definitions
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- Core Error & Operational Security Controls ---
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn", // Completely blocks production console leaks
      "no-debugger": "error",
      "prefer-const": "error",

      // --- TypeScript Specific Type Checks ---
      "@typescript-eslint/no-explicit-any": "error", // Absolute zero 'any' leaks allowed
      "@typescript-eslint/no-floating-promises": "error", // Forces all async executions to attach a catch block or await
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false }, // Allows passing async controllers directly into Express/Fastify routers
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-unused-vars": "off", // Defer to more accurate TypeScript specific validation check above
      "no-undef": "off", // Managed directly by TypeScript compilation engine checks

      // --- Node.js & Security Architecture Rules ---
      "n/no-missing-import": "off", // Handled natively by modern TypeScript moduleResolution configurations
      "n/no-process-exit": "error", // Blocks dangerous process kills that bypass graceful server shutdowns
      "n/global-require": "error", // Forces standardized static top-level ES6 import bindings
      "n/no-unpublished-import": "off", // Allows importing of devDependencies for testing and seeding scripts without false positives
    },
  },
  {
    // Seed scripts are dev-only tooling run manually from the CLI; console
    // output is their primary UX, so the app-wide no-console rule doesn't apply.
    files: ["prisma/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Test files are transpiled by Jest (swc), excluded from the tsconfig
    // project, so type-aware rules don't apply. Supertest response bodies are
    // `any`, and console is fine in tests.
    files: ["**/*.test.ts", "**/*.spec.ts", "src/test/**/*.ts"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // MUST BE LAST: Disables all stylistic ESLint rules that conflict with Prettier
  eslintConfigPrettier,
);
