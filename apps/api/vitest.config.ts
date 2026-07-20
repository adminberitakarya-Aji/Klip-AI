import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Mock Next.js to avoid "Cannot find module 'next/constants'" error
    alias: {
      "next/constants": "node:constants",
      "next/headers": "node:util",
      "@": path.resolve(__dirname, "src"),
      "@/*": path.resolve(__dirname, "src") + "/*",
    },
  },
});
