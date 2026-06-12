import { getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { CartPageClient } from '@/components/CartPageClient';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string }>;
}

export default async function CartPage({ params }: Props) {
  const { shopSlug } = await params;

  try {
    const shopInfo = await getShopInfo(shopSlug);
    if (!shopInfo) return notFound();

    // Cart is a fixed (non-customisable) page rendered from the live cart store.
    return <CartPageClient />;
  } catch (error) {
    console.error('Error rendering cart page:', error);
    return notFound();
  }
}
