import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  transpilePackages: ['@ecommerce/ui-registry'],
};

export default nextConfig;
