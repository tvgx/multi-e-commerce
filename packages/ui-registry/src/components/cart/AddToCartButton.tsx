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
  const [error, setError] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const t = useTranslations('shop');
  const te = useTranslations('errors');

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    const result = await addItem({
      productId,
      variantId,
      price,
      title,
      imageUrl,
      quantity,
    });
    // TODO 8: backend giờ chặn vượt tồn kho từ giỏ — hiển thị lỗi ngay dưới nút.
    if (!result.ok) {
      if (result.code === 'INSUFFICIENT_STOCK' && result.available != null) {
        setError(t('products.exceedStock', { count: result.available }));
      } else {
        setError(result.message || te('cart.failedToAddItem'));
      }
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={`bg-brand hover:bg-brand/90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? t('products.adding') : (children || t('products.addToCart'))}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500 basis-full">
          {error}
        </p>
      )}
    </>
  );
}
