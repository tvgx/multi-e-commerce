'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';

export default function CartInitializer({ shopId }: { shopId: string }) {
  const initialize = useCartStore((state) => state.initialize);

  useEffect(() => {
    if (shopId) {
      initialize(shopId);
    }
  }, [shopId, initialize]);

  return null;
}
