import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add these configurations to help with build traces
  experimental: {
    // Optimize build trace collection
    optimizePackageImports: ['lucide-react', 'date-fns'], // Add your heavy packages here
  },
  
  // Reduce what gets traced
  outputFileTracingIgnores: [
    '**/.git/**',
    '**/node_modules/.cache/**',
    '**/node_modules/@swc/**',
  ],
  
  // Explicitly set output mode
  output: 'standalone',
};

export default nextConfig;