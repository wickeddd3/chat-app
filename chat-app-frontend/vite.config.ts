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
    // Unit tests live under src/; keep Vitest away from Playwright e2e specs.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
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
      // Regression floors, set just below current coverage so the suite can't
      // silently slip. Raise these as coverage grows.
      thresholds: {
        statements: 40,
        branches: 48,
        functions: 43,
        lines: 40,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Group vendor code into a handful of logical, cache-stable chunks
        // rather than one-per-package (which fans out into dozens of tiny
        // requests). Buckets are ordered most-specific first.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id))
            return "react-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (/framer-motion|motion-dom|motion-utils/.test(id))
            return "motion-vendor";
          if (id.includes("react-virtuoso")) return "virtuoso-vendor";
          if (/radix-ui|@base-ui|vaul|cmdk|sonner/.test(id)) return "ui-vendor";
          if (/@phosphor-icons|lucide-react/.test(id)) return "icons-vendor";
          if (/react-hook-form|@hookform|zod/.test(id)) return "form-vendor";
          if (/socket\.io|engine\.io/.test(id)) return "socket-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("date-fns")) return "date-vendor";

          return "vendor";
        },
      },
    },
  },
});
