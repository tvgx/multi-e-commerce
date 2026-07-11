'use client';

import { useCartStore } from '../../store/cart-store';
import { useParams } from 'next/navigation';
import { SmartImage } from '../blocks/SmartImage';
import { usePriceFormatter } from '../../lib/use-price';
import { useTranslations } from '@ecommerce/i18n/src/react';

export function CartSidebar() {
  const { items, totalAmount, isOpen, setIsOpen, updateQuantity, removeItem } = useCartStore();
  const params = useParams();
  const t = useTranslations('shop');
  const formatPrice = usePriceFormatter();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/50 z-[100] transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] flex flex-col transform transition-transform">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('cart.titleWithCount', { count: items.reduce((s, i) => s + i.quantity, 0) })}</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label={t('cart.closeAria')}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              {t('cart.empty')}
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  {item.imageUrl && <SmartImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" sizes="80px" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold line-clamp-2">{item.title || t('cart.itemFallback')}</h3>
                  <div className="text-brand font-medium mt-1">
                    {formatPrice((item.price))}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                      aria-label={t('cart.decreaseAria')}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="w-4 text-center" aria-live="polite">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      aria-label={t('cart.increaseAria')}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >+</button>
                    <button 
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      {t('cart.removeItem')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <span className="font-medium text-slate-600">{t('cart.subtotal')}</span>
              <span className="text-2xl font-bold">{formatPrice((totalAmount))}</span>
            </div>
            <a
              href={`/${params.shopSlug || ''}/payment`}
              className="block w-full bg-brand text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-brand/90 transition-colors shadow-lg hover:shadow-brand/25"
            >
              {t('cart.checkout')}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
