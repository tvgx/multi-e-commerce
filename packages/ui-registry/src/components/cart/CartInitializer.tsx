'use client';

import { useEffect } from 'react';
import { useCartStore } from '../../store/cart-store';

export function CartInitializer({ shopSlug }: { shopSlug: string }) {
  const initialize = useCartStore((state) => state.initialize);

  useEffect(() => {
    if (shopSlug) {
      initialize(shopSlug);
    }
  }, [shopSlug, initialize]);

  return null;
}
