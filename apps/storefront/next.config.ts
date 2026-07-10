import type { NextConfig } from "next";

// Transactional / account-scoped routes must never be indexed. We emit
// `X-Robots-Tag: noindex` at the edge so it also covers client-component pages
// (login, cart, wallet…) that can't `export const metadata`. Note: we do NOT
// set X-Frame-Options — the admin builder renders the storefront in a preview
// iframe, so framing must stay allowed.
const NOINDEX = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
  poweredByHeader: false,
  transpilePackages: ['@ecommerce/ui-registry', '@ecommerce/i18n'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    const privatePaths = [
      '/:shopSlug/account/:path*',
      '/:shopSlug/cart',
      '/:shopSlug/profile',
      '/:shopSlug/wishlist',
      '/:shopSlug/wallet',
      '/:shopSlug/payment/:path*',
      '/payment/:path*',
    ];
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      ...privatePaths.map((source) => ({ source, headers: [NOINDEX] })),
    ];
  },
};

export default nextConfig;
