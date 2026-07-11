'use client';

import React, { useEffect, use } from 'react';
import { useOrders, Order } from '@/hooks/useOrders';
import { Loader2, Package, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePriceFormatter } from '@ecommerce/ui-registry/src/lib/use-price';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export default function OrdersPage({ params }: { params: Promise<{ shopId: string }> }) {
  const formatPrice = usePriceFormatter();
  const { shopId } = use(params);
  const { orders, loading, error, fetchOrders, updateOrderStatus } = useOrders(shopId);
  const t = useTranslations('admin');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (order: Order, newState: Order['state']) => {
    // Valid transitions
    const validTransitions: Record<string, string[]> = {
      checkout: ['confirmed', 'canceled'],
      confirmed: ['processing', 'canceled'],
      processing: ['shipped', 'canceled'],
      shipped: ['delivered', 'canceled'],
      delivered: ['completed'],
      canceled: [],
      refunded: [],
      completed: []
    };

    if (validTransitions[order.state]?.includes(newState)) {
      updateOrderStatus(order.id, newState);
    } else {
      toast.error(t('orders.invalidTransition', { from: order.state, to: newState }));
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'checkout': return 'bg-slate-100 text-slate-700';
      case 'confirmed': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'completed': return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'canceled': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('orders.title')}</h1>
          <p className="text-slate-400">{t('orders.subtitle')}</p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('orders.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t('orders.colId')}</th>
                <th className="px-6 py-4 font-medium">{t('orders.colCustomer')}</th>
                <th className="px-6 py-4 font-medium">{t('orders.colDate')}</th>
                <th className="px-6 py-4 font-medium">{t('orders.colTotal')}</th>
                <th className="px-6 py-4 font-medium">{t('orders.colPayment')}</th>
                <th className="px-6 py-4 font-medium">{t('orders.colStatus')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('orders.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-4" />
                    <p className="text-slate-400">{t('orders.loading')}</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">{t('orders.none')}</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      #{order.number || order.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{order.customerInfo?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded-md uppercase">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getStatusColor(order.state)}`}>
                        {t(`orderStates.${order.state}`, { defaultValue: order.state })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* State Machine Buttons */}
                      {order.state === 'checkout' && (
                        <>
                          <button onClick={() => handleStatusChange(order, 'confirmed')} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded text-xs font-bold">
                            {t('orders.confirm')}
                          </button>
                          <button onClick={() => handleStatusChange(order, 'canceled')} className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs font-bold">
                            {t('orders.cancel')}
                          </button>
                        </>
                      )}
                      {order.state === 'confirmed' && (
                        <button onClick={() => handleStatusChange(order, 'processing')} className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs font-bold">
                          {t('orders.process')}
                        </button>
                      )}
                      {order.state === 'processing' && (
                        <button onClick={() => handleStatusChange(order, 'shipped')} className="px-3 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded text-xs font-bold">
                          {t('orders.ship')}
                        </button>
                      )}
                      {order.state === 'shipped' && (
                        <button onClick={() => handleStatusChange(order, 'delivered')} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-xs font-bold">
                          {t('orders.deliver')}
                        </button>
                      )}
                      {order.state === 'delivered' && (
                        <button onClick={() => handleStatusChange(order, 'completed')} className="px-3 py-1 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 rounded text-xs font-bold">
                          {t('orders.complete')}
                        </button>
                      )}
                      <Link 
                        href={`/dashboard/${shopId}/orders/${order.id}`}
                        className="px-3 py-1 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 rounded text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Eye size={14} /> {t('orders.view')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
