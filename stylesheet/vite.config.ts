import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
    },
  },
  css: {
    postcss: { plugins: [] },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        elements: path.resolve(import.meta.dirname, "elements.html"),
        components: path.resolve(import.meta.dirname, "components.html"),
        patterns: path.resolve(import.meta.dirname, "patterns.html"),
      },
    },
  },
  server: {
    port: 5001,
    host: "0.0.0.0",
    fs: {
      allow: [path.resolve(import.meta.dirname, "..")],
    },
  },
});
