import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "/", // ✅ This is the fix
  server: {
    host: "::",
    port: 8080,
    fs: { strict: false },
    watch: { usePolling: true },
    proxy: {
      // Proxy `/api` requests to local dev API (scripts/dev-api.js)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
