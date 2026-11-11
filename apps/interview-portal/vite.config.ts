import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
