import { getShopProductDetails, getShopInfo, getShopPageLayout } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { ProductDetailDefault } from '@ecommerce/ui-registry/src/components/products/ProductDetailDefault';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string; productId: string }>;
}

export default async function ProductDetailsPage({ params }: Props) {
  const { shopSlug, productId } = await params;

  try {
    const [productRes, shopInfo, pageLayout] = await Promise.all([
      getShopProductDetails(shopSlug, productId),
      getShopInfo(shopSlug),
      getShopPageLayout(shopSlug, 'product_detail')
    ]);

    const product = productRes?.product;

    if (!product || !shopInfo) return notFound();

    if (!pageLayout) {
        return <ProductDetailDefault product={product} shopInfo={shopInfo} />;
    }

    // Pass product and shopInfo as pageContext so that the Mega-Component receives them
    return <LayoutRenderer pageLayout={pageLayout} pageContext={{ product, shopInfo, basePath: `/${shopSlug}` }} />;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return notFound();
  }
}
