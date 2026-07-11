import { getCollectionBySlug, getShopInfo, getShopPageLayout } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { StandardCategoryPage } from '@ecommerce/ui-registry/src/components/pages/StandardCategoryPage';
import { shopUrl, metaText } from '@/lib/seo';
import { getLocale } from '@/lib/i18n';
import type { Metadata } from 'next';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug, slug } = await params;
  const collection = await getCollectionBySlug(shopSlug, slug);
  const canonical = shopUrl(shopSlug, `/collections/${slug}`);
  if (!collection) return { alternates: { canonical } };
  const title = collection.title || collection.name || slug;
  const description = metaText(collection.description || `Bộ sưu tập ${title}.`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', title, description, url: canonical },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { shopSlug, slug } = await params;

  try {
    const [collection, shopInfo, pageLayout, locale] = await Promise.all([
      getCollectionBySlug(shopSlug, slug),
      getShopInfo(shopSlug),
      getShopPageLayout(shopSlug, 'product_listing'),
      getLocale(),
    ]);

    if (!collection || !shopInfo) return notFound();

    const products = collection.products?.map((pc: any) => pc.product) || [];

    // No saved layout yet → render the fixed standard listing so the page is
    // never broken for a shop that hasn't customised this page.
    if (!pageLayout) {
        return (
            <StandardCategoryPage
                title={collection.title}
                description={collection.description}
                products={products}
                totalProducts={products.length}
                basePath={`/${shopSlug}`}
                locale={locale}
            />
        );
    }

    // Pass collection and mapped products as pageContext so that the Mega-Component receives them
    return <LayoutRenderer pageLayout={pageLayout} pageContext={{
        shopInfo,
        title: collection.title,
        description: collection.description,
        products,
        basePath: `/${shopSlug}`,
        locale
    }} />;
  } catch (error) {
    console.error('Error fetching collection details:', error);
    return notFound();
  }
}
