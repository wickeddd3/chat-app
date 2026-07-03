/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // This maps the '@' symbol to 'src' folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Listen on all local IPs
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    // Dummy Supabase env so modules that build the client at import time
    // (e.g. axios.client -> supabase.client) don't throw when tests run
    // without a local .env (such as on CI). Tests mock network layers, so
    // these values are never used to make real requests.
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      // With `include` set, every matched source file is measured (even
      // untested ones), for an honest picture.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.types.ts",
        "src/**/*.docs.ts",
        "src/**/index.ts", // barrels are re-export only
        "src/shared/ui/shadcn/**", // vendored primitives
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Creates a separate chunk for everything in node_modules
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
});
