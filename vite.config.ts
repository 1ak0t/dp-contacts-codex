import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  appType: "mpa",
  plugins: [react()],
  build: {
    assetsDir: "contacts/assets",
    rollupOptions: {
      input: {
        root: "index.html",
        contacts: "contacts/index.html",
      },
    },
  },
});
