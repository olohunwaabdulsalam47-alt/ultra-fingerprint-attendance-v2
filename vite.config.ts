import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ultra-fingerprint-attendance-v2/",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
