import { getShopPageLayout, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { shopSlug } = await params;

  try {
    const [shopInfo, pageLayout] = await Promise.all([
      getShopInfo(shopSlug),
      getShopPageLayout(shopSlug, 'checkout')
    ]);

    if (!shopInfo) return notFound();
    if (!pageLayout) return <div className="text-center py-20">Layout not found</div>;

    return <LayoutRenderer pageLayout={pageLayout} pageContext={{ shopInfo, shopSlug }} />;
  } catch (error) {
    console.error('Error fetching checkout page layout:', error);
    return notFound();
  }
}
