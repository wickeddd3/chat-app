/** @type {import('jest').Config} */

// Shared transform/resolution used by both projects. swc transpile — decoupled
// from the TS version and supports the decorator metadata InversifyJS relies on.
// Also matches .js so ESM-only deps (inversify) can be down-leveled.
const common = {
  moduleNameMapper: {
    // Mirror the tsconfig path aliases (order matters: @/prisma before @/*).
    "^@/prisma/(.*)$": "<rootDir>/prisma/generated/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // The generated prisma-client emits .ts files that import with `.js`
    // extensions (ESM convention). Strip the extension so Jest resolves the .ts.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
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
};

module.exports = {
  // Two suites, selectable via --selectProjects:
  //   unit        — fast, infra mocked per-test (default `npm test`).
  //   integration — real Postgres test DB, *.int.test.ts (`npm run test:int`).
  projects: [
    {
      ...common,
      displayName: "unit",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      // Unit tests are *.test.ts / *.spec.ts but NOT the integration *.int.test.ts.
      testMatch: ["**/*.test.ts", "**/*.spec.ts"],
      testPathIgnorePatterns: ["\\.int\\.test\\.ts$"],
      setupFiles: ["<rootDir>/src/test/setup.ts"],
    },
    {
      ...common,
      displayName: "integration",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["**/*.int.test.ts"],
      // The real DB is shared + truncated between tests, so files must not run in
      // parallel (a second file's truncate would wipe the first's rows mid-test).
      // Per-project maxWorkers isn't honored under --selectProjects, so the
      // integration/coverage npm scripts pass --runInBand to enforce serial runs.
      maxWorkers: 1,
      // Point env at the test DB before app.config loads.
      setupFiles: ["<rootDir>/src/test/integration.setup.ts"],
      // Truncate between tests + disconnect after the file (registered globally).
      setupFilesAfterEnv: ["<rootDir>/src/test/integration.hooks.ts"],
      // Create + migrate the test DB once for the whole run.
      globalSetup: "<rootDir>/src/test/global-setup.int.ts",
    },
  ],

  // Coverage is measured from the unit suite (see `npm run test:coverage`).
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.int.test.ts",
    "!src/index.ts",
    "!src/**/*.docs.ts",
    "!src/**/*.types.ts",
    "!src/test/**",
  ],

  // Regression floor — pinned just below current coverage so it can't backslide.
  // Ratchet upward as tests are added (enforced by `npm run test:coverage`).
  coverageThreshold: {
    global: {
      statements: 53,
      branches: 34,
      functions: 35,
      lines: 52,
    },
  },
};
