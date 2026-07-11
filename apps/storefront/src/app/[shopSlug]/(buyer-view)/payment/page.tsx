import { getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { CheckoutDefault } from '@ecommerce/ui-registry/src/components/cart/CheckoutDefault';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string }>;
}

// Trang thanh toán cố ý KHÔNG render layout builder — luôn dùng CheckoutDefault
// để luồng đặt hàng ổn định, người bán không tùy chỉnh được (TODO 21).
export default async function CheckoutPage({ params }: Props) {
  const { shopSlug } = await params;

  try {
    const shopInfo = await getShopInfo(shopSlug);
    if (!shopInfo) return notFound();

    return <CheckoutDefault shopInfo={shopInfo} shopSlug={shopSlug} />;
  } catch (error) {
    console.error('Error fetching checkout page:', error);
    return notFound();
  }
}
