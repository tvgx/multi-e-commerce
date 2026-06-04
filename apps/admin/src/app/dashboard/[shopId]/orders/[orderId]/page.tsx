'use client';

import React, { useEffect, useState, use } from 'react';
import { useOrders, Order } from '@/hooks/useOrders';
import { Loader2, ArrowLeft, Package, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage({ params }: { params: Promise<{ shopId: string, orderId: string }> }) {
  const { shopId, orderId } = use(params);
  const { fetchOrderById, updateOrderStatus } = useOrders(shopId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderById(orderId);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [fetchOrderById, orderId]);

  const handleStatusChange = async (newState: Order['state']) => {
    if (!order) return;
    const success = await updateOrderStatus(order.id, newState);
    if (success) {
      setOrder({ ...order, state: newState });
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

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error || 'Order not found'}
        </div>
        <Link href={`/dashboard/${shopId}/orders`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <Link href={`/dashboard/${shopId}/orders`} className="text-slate-400 hover:text-white flex items-center gap-2 w-fit mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              Order #{order.number || order.id.substring(0, 8)}
              <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getStatusColor(order.state)}`}>
                {order.state}
              </span>
            </h1>
            <p className="text-slate-400">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          
          <div className="flex gap-2">
            {order.state === 'checkout' && (
              <>
                <button onClick={() => handleStatusChange('confirmed')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-colors">Confirm Order</button>
                <button onClick={() => handleStatusChange('canceled')} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors">Cancel</button>
              </>
            )}
            {order.state === 'confirmed' && (
              <button onClick={() => handleStatusChange('processing')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors">Mark Processing</button>
            )}
            {order.state === 'processing' && (
              <button onClick={() => handleStatusChange('shipped')} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-colors">Mark Shipped</button>
            )}
            {order.state === 'shipped' && (
              <button onClick={() => handleStatusChange('delivered')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors">Mark Delivered</button>
            )}
            {order.state === 'delivered' && (
              <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">Complete Order</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Package size={18} className="text-indigo-400" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-white">{item.productName || item.productId}</div>
                    <div className="text-sm text-slate-400">Qty: {item.quantity} × {item.unitPrice.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div className="font-bold text-white">
                    {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <User size={18} className="text-indigo-400" /> Customer Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">Name</div>
                <div className="text-white font-medium">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Email</div>
                <div className="text-white">{order.customerInfo?.email || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Phone</div>
                <div className="text-white">{order.customerInfo?.phone || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Shipping Address</div>
                <div className="text-white">{order.customerInfo?.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-indigo-400" /> Payment Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">Method</div>
                <div className="text-white font-medium uppercase">{order.paymentMethod}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Status</div>
                <div className="text-white">
                  {order.state === 'checkout' ? 'Pending' : 'Paid'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
