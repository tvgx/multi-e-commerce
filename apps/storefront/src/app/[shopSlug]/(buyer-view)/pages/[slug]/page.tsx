import { getShopPageBySlug, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { shopUrl, metaText } from '@/lib/seo';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ shopSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug, slug } = await params;
  const page = await getShopPageBySlug(shopSlug, slug);
  const canonical = shopUrl(shopSlug, `/pages/${slug}`);
  if (!page) return { alternates: { canonical } };
  const title = page.title || slug;
  const description = page.metaDescription || page.excerpt
    ? metaText(page.metaDescription || page.excerpt)
    : undefined;
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: { type: 'article', title, ...(description ? { description } : {}), url: canonical },
  };
}

export default async function CustomPage({ params }: Props) {
  const { shopSlug, slug } = await params;

  const [page, shopInfo] = await Promise.all([
    getShopPageBySlug(shopSlug, slug),
    getShopInfo(shopSlug)
  ]);

  if (!page) {
    notFound();
  }

  // A custom page is essentially a collection of sections
  // We wrap it in a Layout-like object to use LayoutRenderer
  const pageLayout = {
    components: page.sections || []
  };

  return (
    <div className="min-h-screen">
      {/* Page Title / Header (Optional, since the page might have its own Hero) */}
      {!page.sections?.some((s: any) => s.componentId === 'Hero') && (
        <div className="container mx-auto px-4 py-12 border-b border-slate-100">
          <h1 className="text-4xl font-bold text-slate-900">{page.title}</h1>
        </div>
      )}

      <LayoutRenderer pageLayout={pageLayout} />
    </div>
  );
}
