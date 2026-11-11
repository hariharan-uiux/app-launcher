import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3300,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
