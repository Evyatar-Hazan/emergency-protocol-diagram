import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(clientRoot, "index.html"),
        "offline-learning": resolve(clientRoot, "offline-learning.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
      },
    },
  },
});
