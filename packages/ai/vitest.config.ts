import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/__tests__/**", "src/**/*.d.ts"],
    },
    // Mock Next.js to avoid "Cannot find module 'next/constants'" error
    // from @sentry/nextjs when it's imported by provider-router.ts
    alias: {
      "next/constants": "node:constants",
      "next/headers": "node:util",
    },
  },
});
