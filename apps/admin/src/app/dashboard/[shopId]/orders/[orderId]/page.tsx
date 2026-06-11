'use client';

import React, { useEffect, useState, use } from 'react';
import { useOrders, Order, Shipment } from '@/hooks/useOrders';
import { Loader2, ArrowLeft, Package, User, CreditCard, Truck, Save } from 'lucide-react';
import Link from 'next/link';

const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'shipped', 'canceled'],
  ready: ['shipped', 'canceled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  canceled: [],
};

const SHIPMENT_STATE_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  ready: 'Sẵn sàng giao',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  returned: 'Hoàn trả',
  canceled: 'Đã huỷ',
};

export default function OrderDetailPage({ params }: { params: Promise<{ shopId: string, orderId: string }> }) {
  const { shopId, orderId } = use(params);
  const { fetchOrderById, updateOrderStatus, updateShipment } = useOrders(shopId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fulfillment form
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [savingShipment, setSavingShipment] = useState(false);

  const shipment: Shipment | undefined = order?.shipments?.[0];

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
      const s = data.shipments?.[0];
      setCarrier(s?.carrier || '');
      setTrackingNumber(s?.trackingNumber || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleStatusChange = async (newState: Order['state']) => {
    if (!order) return;
    const success = await updateOrderStatus(order.id, newState);
    if (success) {
      await loadOrder();
    }
  };

  const handleSaveShipmentInfo = async () => {
    if (!shipment) return;
    setSavingShipment(true);
    try {
      await updateShipment(shipment.id, { carrier, trackingNumber });
      await loadOrder();
    } catch (err: any) {
      alert(`Lỗi cập nhật vận đơn: ${err.message}`);
    } finally {
      setSavingShipment(false);
    }
  };

  const handleShipmentState = async (state: string) => {
    if (!shipment) return;
    setSavingShipment(true);
    try {
      await updateShipment(shipment.id, { state, carrier, trackingNumber });
      await loadOrder();
    } catch (err: any) {
      alert(`Lỗi cập nhật trạng thái giao hàng: ${err.message}`);
    } finally {
      setSavingShipment(false);
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

  const getShipmentColor = (state: string) => {
    switch (state) {
      case 'pending': return 'bg-slate-500/20 text-slate-300';
      case 'ready': return 'bg-amber-500/20 text-amber-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400';
      case 'returned': return 'bg-rose-500/20 text-rose-400';
      case 'canceled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-300';
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

  const allowedShipmentNext = shipment ? (SHIPMENT_TRANSITIONS[shipment.state] || []) : [];

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
              {order.lineItems?.map((item: any, index: number) => (
                <div key={item.id || index} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-white">
                      {item.variant?.product?.name || item.variant?.sku || item.variantId}
                    </div>
                    <div className="text-sm text-slate-400">Qty: {item.quantity} × {(item.price ?? 0).toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div className="font-bold text-white">
                    {(item.quantity * (item.price ?? 0)).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-sm">
              {order.itemTotal != null && order.itemTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tạm tính</span>
                  <span>{order.itemTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {order.promoTotal != null && order.promoTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Giảm giá</span>
                  <span>-{order.promoTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {order.shipmentTotal != null && order.shipmentTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span>{order.shipmentTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          {/* Fulfillment / Shipment */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Truck size={18} className="text-indigo-400" /> Giao hàng
            </h2>

            {!shipment ? (
              <p className="text-slate-400 text-sm">Đơn này chưa có vận đơn.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${getShipmentColor(shipment.state)}`}>
                    {SHIPMENT_STATE_LABELS[shipment.state] || shipment.state}
                  </span>
                  {order.shippingMethod && (
                    <span className="text-sm text-slate-300">
                      Phương thức: <strong>{order.shippingMethod.name}</strong>
                      {order.shippingMethod.estimatedDays ? ` (${order.shippingMethod.estimatedDays})` : ''}
                    </span>
                  )}
                  {shipment.shippedAt && (
                    <span className="text-xs text-slate-500">Gửi: {new Date(shipment.shippedAt).toLocaleString()}</span>
                  )}
                  {shipment.deliveredAt && (
                    <span className="text-xs text-slate-500">Giao: {new Date(shipment.deliveredAt).toLocaleString()}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Đơn vị vận chuyển</label>
                    <input
                      type="text"
                      placeholder="VD: GHN, GHTK, Viettel Post"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Mã vận đơn</label>
                    <input
                      type="text"
                      placeholder="VD: GHN123456789"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveShipmentInfo}
                    disabled={savingShipment}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingShipment ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Lưu vận đơn
                  </button>
                  {allowedShipmentNext.includes('ready') && (
                    <button onClick={() => handleShipmentState('ready')} disabled={savingShipment} className="px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      Sẵn sàng giao
                    </button>
                  )}
                  {allowedShipmentNext.includes('shipped') && (
                    <button onClick={() => handleShipmentState('shipped')} disabled={savingShipment} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      Bắt đầu giao
                    </button>
                  )}
                  {allowedShipmentNext.includes('delivered') && (
                    <button onClick={() => handleShipmentState('delivered')} disabled={savingShipment} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      Đã giao thành công
                    </button>
                  )}
                  {allowedShipmentNext.includes('returned') && (
                    <button onClick={() => handleShipmentState('returned')} disabled={savingShipment} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      Hoàn trả
                    </button>
                  )}
                </div>
              </div>
            )}
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
                <div className="text-white font-medium">{order.recipientName || order.customer?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Email</div>
                <div className="text-white">{order.customer?.email || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Phone</div>
                <div className="text-white">{order.recipientPhone || order.customer?.phoneNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Shipping Address</div>
                <div className="text-white">
                  {[order.shippingAddress, order.shippingCity, order.shippingProvince].filter(Boolean).join(', ') || 'N/A'}
                </div>
              </div>
              {order.shippingNote && (
                <div>
                  <div className="text-slate-400 mb-1">Note</div>
                  <div className="text-white">{order.shippingNote}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-indigo-400" /> Payment Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">Method</div>
                <div className="text-white font-medium uppercase">
                  {order.payments?.[0]?.paymentMethod?.name || order.paymentMethod || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Status</div>
                <div className="text-white capitalize">{order.paymentState || (order.state === 'checkout' ? 'Pending' : 'Paid')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
