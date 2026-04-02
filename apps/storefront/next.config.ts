import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
  transpilePackages: ['@ecommerce/ui-registry'],
};

export default nextConfig;
