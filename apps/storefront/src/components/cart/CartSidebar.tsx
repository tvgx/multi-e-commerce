'use client';

import { useCartStore } from '@/store/cart-store';
import { useParams } from 'next/navigation';

export default function CartSidebar() {
  const { items, totalAmount, isOpen, setIsOpen, updateQuantity, removeItem } = useCartStore();
  const params = useParams();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/50 z-[100] transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] flex flex-col transform transition-transform">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              Your cart is empty
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold line-clamp-2">{item.title || 'Product'}</h3>
                  <div className="text-emerald-600 font-medium mt-1">
                    {(item.price).toLocaleString()}đ
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >+</button>
                    <button 
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
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
              <span className="font-medium text-slate-600">Subtotal</span>
              <span className="text-2xl font-bold">{(totalAmount).toLocaleString()}đ</span>
            </div>
            <a 
              href={`/${params.shopSlug || ''}/payment`}
              className="block w-full bg-emerald-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-emerald-500/25"
            >
              Proceed to Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}
