import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Standalone output diperlukan untuk Docker deployment
  output: "standalone",
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
