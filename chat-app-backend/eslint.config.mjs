import eslintjs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "dist"] },
  {
    extends: [eslintjs.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts}"],
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "prefer-const": "error",
      "no-console": "warn",
    },
  },
);
