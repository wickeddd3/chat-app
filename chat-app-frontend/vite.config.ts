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
