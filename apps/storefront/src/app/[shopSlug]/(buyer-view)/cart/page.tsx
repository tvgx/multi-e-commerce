import { getShopPageLayout, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string }>;
}

export default async function CartPage({ params }: Props) {
  const { shopSlug } = await params;

  try {
    const [shopInfo, pageLayout] = await Promise.all([
      getShopInfo(shopSlug),
      getShopPageLayout(shopSlug, 'cart')
    ]);

    if (!shopInfo) return notFound();
    if (!pageLayout) return <div className="text-center py-20">Layout not found</div>;

    // Cart store data is on client-side, but standard components can read it if needed.
    return <LayoutRenderer pageLayout={pageLayout} pageContext={{ shopInfo }} />;
  } catch (error) {
    console.error('Error fetching cart page layout:', error);
    return notFound();
  }
}
