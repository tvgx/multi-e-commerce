'use client';

import { useState } from 'react';
import { useCartStore } from '../../store/cart-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  price: number;
  title: string;
  imageUrl?: string;
  className?: string;
  children?: React.ReactNode;
  quantity?: number;
}

export function AddToCartButton({
  productId,
  variantId,
  price,
  title,
  imageUrl,
  className = '',
  children,
  quantity = 1,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const t = useTranslations('shop');

  const handleAddToCart = async () => {
    setLoading(true);
    await addItem({
      productId,
      variantId,
      price,
      title,
      imageUrl,
      quantity,
    });
    setLoading(false);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`bg-brand hover:bg-brand/90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? t('products.adding') : (children || t('products.addToCart'))}
    </button>
  );
}
