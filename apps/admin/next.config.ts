import type { NextConfig } from "next";

// Security headers áp cho mọi route. X-Robots-Tag phủ nốt các asset không
// đi qua HTML <meta> (admin là dashboard nội bộ → noindex toàn bộ).
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ẩn header `X-Powered-By: Next.js` (SEO/security audit flag).
  poweredByHeader: false,
  transpilePackages: ['@ecommerce/ui-registry', '@ecommerce/i18n'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
