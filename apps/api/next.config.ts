import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@klipai/ui', '@klipai/core', '@klipai/config', '@klipai/ai'],
  },
  transpilePackages: ['@klipai/ui', '@klipai/core', '@klipai/config', '@klipai/ai'],
};

export default nextConfig;