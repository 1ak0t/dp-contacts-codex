import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

const https = {
  key: fs.readFileSync(new URL("./ssl/csr_key.txt", import.meta.url)),
  cert: fs.readFileSync(new URL("./ssl/detail-project.ru.fullchain.crt", import.meta.url)),
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5412,
    https,
  },
  preview: {
    host: "0.0.0.0",
    port: 5412,
    https,
  },
});
