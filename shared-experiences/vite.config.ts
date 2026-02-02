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
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
