import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable standalone output to skip build trace collection
  output: undefined,
  
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;