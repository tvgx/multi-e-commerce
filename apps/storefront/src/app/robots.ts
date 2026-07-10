import type { MetadataRoute } from 'next';

// Host-level robots for the storefront. Public shop content (home, products,
// collections, custom pages) is crawlable; transactional / account-scoped
// routes are disallowed across every shop via per-shop wildcard patterns.
//
// Sitemaps are per-shop (one host serves many shops on the path form), so they
// are NOT listed here — each shop exposes its own sitemap.xml under its slug for
// the merchant to submit to Search Console.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/payment',
                    '/*/account',
                    '/*/cart',
                    '/*/checkout',
                    '/*/payment',
                    '/*/profile',
                    '/*/wishlist',
                    '/*/wallet',
                ],
            },
        ],
    };
}
