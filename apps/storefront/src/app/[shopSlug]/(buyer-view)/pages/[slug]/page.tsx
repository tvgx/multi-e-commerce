import { getShopPageBySlug, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';

interface Props {
  params: Promise<{ shopSlug: string; slug: string }>;
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
  const mockLayout = {
    shopId: shopSlug,
    isMaster: false,
    templateType: 'standard' as const,
    pages: {
      [slug]: page.sections || []
    },
    metadata: {}
  };

  return (
    <div className="min-h-screen">
      {/* Page Title / Header (Optional, since the page might have its own Hero) */}
      {!page.sections?.some((s: any) => s.componentId === 'Hero') && (
        <div className="container mx-auto px-4 py-12 border-b border-slate-100">
          <h1 className="text-4xl font-bold text-slate-900">{page.title}</h1>
        </div>
      )}

      <LayoutRenderer layout={mockLayout} pageKey={slug} />
    </div>
  );
}
