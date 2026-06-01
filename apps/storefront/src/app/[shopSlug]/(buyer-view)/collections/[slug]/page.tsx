import { getCollectionBySlug, getShopInfo, getShopPageLayout } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string; slug: string }>;
}

export default async function CollectionPage({ params }: Props) {
  const { shopSlug, slug } = await params;

  try {
    const [collection, shopInfo, pageLayout] = await Promise.all([
      getCollectionBySlug(shopSlug, slug),
      getShopInfo(shopSlug),
      getShopPageLayout(shopSlug, 'product_listing')
    ]);

    if (!collection || !shopInfo) return notFound();
    if (!pageLayout) return <div className="text-center py-20">Layout not found</div>;

    const products = collection.products?.map((pc: any) => pc.product) || [];

    // Pass collection and mapped products as pageContext so that the Mega-Component receives them
    return <LayoutRenderer pageLayout={pageLayout} pageContext={{ 
        shopInfo, 
        title: collection.title, 
        description: collection.description, 
        products 
    }} />;
  } catch (error) {
    console.error('Error fetching collection details:', error);
    return notFound();
  }
}
