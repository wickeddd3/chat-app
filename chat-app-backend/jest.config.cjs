/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],

  // Sets NODE_ENV=test + dummy env before app.config's cleanEnv runs at import.
  setupFiles: ["<rootDir>/src/test/setup.ts"],

  // Mirror the tsconfig path aliases (order matters: @/prisma before @/*).
  moduleNameMapper: {
    "^@/prisma/(.*)$": "<rootDir>/prisma/generated/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // swc transpile — decoupled from the TS version and supports the decorator
  // metadata InversifyJS relies on. Also matches .js so ESM-only deps
  // (inversify) can be down-leveled (see transformIgnorePatterns).
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: "es2022",
          keepClassNames: true,
        },
      },
    ],
  },

  // inversify 8 (+ @inversifyjs/*) ship ESM; transform them instead of ignoring
  // all of node_modules, so Jest (CJS) can require them.
  transformIgnorePatterns: ["node_modules/(?!(inversify|@inversifyjs)/)"],

  clearMocks: true,
  // Exclude entrypoints, generated code, and pure type/docs modules from coverage.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
    "!src/**/*.docs.ts",
    "!src/**/*.types.ts",
    "!src/test/**",
  ],

  // Regression floor — pinned just below current coverage so it can't backslide.
  // Ratchet these upward as tests are added (enforced by `npm run test:coverage`).
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 5,
      functions: 6,
      lines: 10,
    },
  },
};
