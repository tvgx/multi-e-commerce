import { resolveShopContext, getShopProducts } from '@/lib/api/storefront.api';
import { shopUrl } from '@/lib/seo';

/**
 * Per-shop sitemap. One platform host serves many shops on the path form, so a
 * single root sitemap can't enumerate them — instead each shop exposes its own
 * at `/(shopSlug)/sitemap.xml`, which merchants submit to Search Console.
 *
 * Lists the crawlable public surface: home, the all-products listing, and every
 * product. Account/cart/checkout pages are excluded (they're noindex anyway).
 */
export const revalidate = 3600; // regenerate hourly

function xmlEscape(url: string): string {
    return url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(_req: Request, { params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;

    const shop = await resolveShopContext(shopSlug);
    if (!shop?.id) {
        return new Response('Not found', { status: 404 });
    }

    const { products } = await getShopProducts(shopSlug, { limit: 500 });

    const urls: { loc: string; priority: string }[] = [
        { loc: shopUrl(shopSlug), priority: '1.0' },
        { loc: shopUrl(shopSlug, '/all-products'), priority: '0.8' },
        ...products.map((p) => ({
            loc: shopUrl(shopSlug, `/products/${p._id}`),
            priority: '0.7',
        })),
    ];

    const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
            .map(
                (u) =>
                    `  <url><loc>${xmlEscape(u.loc)}</loc><changefreq>daily</changefreq><priority>${u.priority}</priority></url>`,
            )
            .join('\n') +
        `\n</urlset>\n`;

    return new Response(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
