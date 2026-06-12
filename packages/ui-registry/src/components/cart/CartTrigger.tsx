'use client';

import { useCartStore } from '../../store/cart-store';
import { ShoppingBag } from 'lucide-react'; // Ensure lucide-react is installed, or fallback to simple icon
import React from 'react';
import { useTranslations } from '@ecommerce/i18n/src/react';

export function CartTrigger() {
  const { setIsOpen, items } = useCartStore();
  const t = useTranslations('shop');
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={() => setIsOpen(true)}
      aria-label={itemCount > 0 ? t('cart.ariaWithCount', { count: itemCount }) : t('cart.ariaLabel')}
      className="relative p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center"
    >
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      {itemCount > 0 && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}
