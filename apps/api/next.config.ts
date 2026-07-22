import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Standalone output diperlukan untuk Docker deployment
  output:
    process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  experimental: {
    optimizePackageImports: [
      "@klipai/ui",
      "@klipai/core",
      "@klipai/config",
      "@klipai/ai",
    ],
  },
  transpilePackages: [
    "@klipai/ui",
    "@klipai/core",
    "@klipai/config",
    "@klipai/ai",
  ],
};

export default nextConfig;
