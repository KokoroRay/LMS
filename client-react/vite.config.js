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
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        // Trỏ về domain gốc
        target: "https://api.hocvienit.id.vn",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
});