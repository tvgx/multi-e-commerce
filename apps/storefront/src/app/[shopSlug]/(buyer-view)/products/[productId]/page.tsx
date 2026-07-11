import { getShopProductDetails, getShopInfo, getShopPageLayout } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { ProductDetailDefault } from '@ecommerce/ui-registry/src/components/products/ProductDetailDefault';
import { shopUrl, metaText } from '@/lib/seo';
import { getLocale } from '@/lib/i18n';
import { JsonLd } from '@/components/JsonLd';
import type { Metadata } from 'next';
import React from 'react';

interface Props {
  params: Promise<{ shopSlug: string; productId: string }>;
}

/** Lowest price across variants (falls back to basePrice). */
function lowestPrice(product: any): number {
  const prices = (product?.variants ?? [])
    .map((v: any) => Number(v.price))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : Number(product?.basePrice) || 0;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug, productId } = await params;
  const res = await getShopProductDetails(shopSlug, productId);
  const product = res?.product;
  if (!product) return {}; // page will render notFound()

  const name = product.name || product.title || 'Sản phẩm';
  const description = metaText(
    product.description || `Mua ${name} chính hãng, giá tốt. Giao hàng nhanh, thanh toán an toàn.`,
  );
  const image: string | undefined = product.images?.[0];
  const canonical = shopUrl(shopSlug, `/products/${productId}`);

  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: name,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
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

    const price = lowestPrice(product);
    const inStock = (product.variants ?? []).some((v: any) => Number(v.stock) > 0);
    const canonical = shopUrl(shopSlug, `/products/${productId}`);

    // Product rich-result structured data + breadcrumb trail.
    const jsonLd = (
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name || product.title,
          ...(product.description ? { description: metaText(product.description, 500) } : {}),
          ...(product.images?.length ? { image: product.images } : {}),
          ...(product.category ? { category: product.category?.name ?? product.category } : {}),
          sku: product._id || product.id,
          brand: { '@type': 'Brand', name: shopInfo.name },
          offers: {
            '@type': 'Offer',
            url: canonical,
            priceCurrency: 'VND',
            price: String(price),
            availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`,
            seller: { '@type': 'Organization', name: shopInfo.name },
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: shopInfo.name, item: shopUrl(shopSlug) },
            { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: shopUrl(shopSlug, '/all-products') },
            { '@type': 'ListItem', position: 3, name: product.name || product.title, item: canonical },
          ],
        },
      ]} />
    );

    if (!pageLayout) {
        return (
          <>
            {jsonLd}
            <ProductDetailDefault product={product} shopInfo={shopInfo} />
          </>
        );
    }

    // Pass product and shopInfo as pageContext so that the Mega-Component receives them
    return (
      <>
        {jsonLd}
        <LayoutRenderer pageLayout={pageLayout} pageContext={{ product, shopInfo, basePath: `/${shopSlug}`, locale: await getLocale() }} />
      </>
    );
  } catch (error) {
    console.error('Error fetching product details:', error);
    return notFound();
  }
}
