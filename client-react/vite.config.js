import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      global: 'globalThis',
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      "/ws": {
        target: process.env.VITE_WS_BASE_URL || "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        // Proxy tự động theo VITE_API_BASE từ .env
        target: process.env.VITE_API_BASE || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});