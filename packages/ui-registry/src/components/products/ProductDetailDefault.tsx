"use client";
import React from 'react';
import { AddToCartButton } from '../cart/AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { ProductReviews } from './ProductReviews';
import { VariantSelector } from './VariantSelector';
import { useState } from 'react';

interface ProductDetailDefaultProps {
  product: any;
  shopInfo: any;
}

export function ProductDetailDefault({ product, shopInfo }: ProductDetailDefaultProps) {
  const thumbnail = product.images?.[0] ?? null;
  const inStock = product.variants?.some((v: any) => v.stock > 0);
  
  // Use the first variant for add to cart in the simple fallback
  const firstVariant = product.variants?.[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(firstVariant?.id || firstVariant?._id || null);

  const selectedVariant = product.variants?.find((v: any) => (v.id || v._id) === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product.basePrice;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Gallery (Simplified) */}
          <div className="md:w-1/2 bg-slate-50 relative aspect-square md:aspect-auto md:min-h-[500px]">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">
                🖼️
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {product.category || 'General'}
              </span>
              {!inStock && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <div className="absolute top-8 right-8 z-10">
              <WishlistButton productId={product._id || product.id} />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight pr-12">
              {product.name || product.title}
            </h1>
            
            <div className="text-3xl font-extrabold text-emerald-600 mb-6 transition-all duration-300">
              {displayPrice?.toLocaleString('vi-VN')}đ
            </div>
            
            <div className="prose prose-slate mb-4 max-w-none">
              <p className="text-slate-600 leading-relaxed">
                {product.description || 'This product does not have a description yet.'}
              </p>
            </div>

            {product.variants && (
              <VariantSelector 
                variants={product.variants.map((v: any) => ({
                  id: v._id || v.id,
                  sku: v.sku,
                  price: v.price || product.basePrice,
                  stock: v.stock || 0,
                  attributes: v.attributes || {}
                }))}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            )}

            <div className="mt-auto">
              <div className="pt-8 border-t border-slate-100 flex gap-4">
                {selectedVariantId ? (
                  <AddToCartButton 
                    productId={product._id || product.id}
                    variantId={selectedVariantId} 
                    price={displayPrice}
                    title={product.name || product.title}
                    imageUrl={thumbnail}
                  />
                ) : firstVariant && (
                  <AddToCartButton 
                    productId={product._id || product.id}
                    variantId={firstVariant._id || firstVariant.id} 
                    price={product.basePrice}
                    title={product.name || product.title}
                    imageUrl={thumbnail}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <ProductReviews productId={product._id || product.id} className="px-8 md:px-12 pb-12" />
      </div>
    </div>
  );
}
