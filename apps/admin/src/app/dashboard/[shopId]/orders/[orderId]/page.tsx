'use client';

import React, { useEffect, useState, use } from 'react';
import { useOrders, Order, Shipment } from '@/hooks/useOrders';
import { Loader2, ArrowLeft, Package, User, CreditCard, Truck, Save } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'shipped', 'canceled'],
  ready: ['shipped', 'canceled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  canceled: [],
};

export default function OrderDetailPage({ params }: { params: Promise<{ shopId: string, orderId: string }> }) {
  const { shopId, orderId } = use(params);
  const { fetchOrderById, updateOrderStatus, updateShipment } = useOrders(shopId);
  const t = useTranslations('admin');
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
      setError(err.message || t('orderDetail.failedToLoad'));
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
      toast.error(`${t('orderDetail.saveShipmentError')}: ${err.message}`);
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
      toast.error(`${t('orderDetail.saveStateError')}: ${err.message}`);
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
          {error || t('orderDetail.orderNotFound')}
        </div>
        <Link href={`/dashboard/${shopId}/orders`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <ArrowLeft size={16} /> {t('orderDetail.backToOrders')}
        </Link>
      </div>
    );
  }

  const allowedShipmentNext = shipment ? (SHIPMENT_TRANSITIONS[shipment.state] || []) : [];

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <Link href={`/dashboard/${shopId}/orders`} className="text-slate-400 hover:text-white flex items-center gap-2 w-fit mb-4 transition-colors">
          <ArrowLeft size={16} /> {t('orderDetail.backToOrders')}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              Order #{order.number || order.id.substring(0, 8)}
              <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getStatusColor(order.state)}`}>
                {t(`orderStates.${order.state}`, { defaultValue: order.state })}
              </span>
            </h1>
            <p className="text-slate-400">{t('orderDetail.placedOn')} {new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex gap-2">
            {order.state === 'checkout' && (
              <>
                <button onClick={() => handleStatusChange('confirmed')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-colors">{t('orderDetail.confirmOrder')}</button>
                <button onClick={() => handleStatusChange('canceled')} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors">{t('orderDetail.cancel')}</button>
              </>
            )}
            {order.state === 'confirmed' && (
              <button onClick={() => handleStatusChange('processing')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors">{t('orderDetail.markProcessing')}</button>
            )}
            {order.state === 'processing' && (
              <button onClick={() => handleStatusChange('shipped')} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-colors">{t('orderDetail.markShipped')}</button>
            )}
            {order.state === 'shipped' && (
              <button onClick={() => handleStatusChange('delivered')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors">{t('orderDetail.markDelivered')}</button>
            )}
            {order.state === 'delivered' && (
              <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">{t('orderDetail.completeOrder')}</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Package size={18} className="text-indigo-400" /> {t('orderDetail.orderItems')}
            </h2>
            <div className="space-y-4">
              {order.lineItems?.map((item: any, index: number) => (
                <div key={item.id || index} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-white">
                      {item.variant?.product?.name || item.variant?.sku || item.variantId}
                    </div>
                    <div className="text-sm text-slate-400">{t('orderDetail.qty')}: {item.quantity} × {formatPrice((item.price ?? 0))}</div>
                  </div>
                  <div className="font-bold text-white">
                    {formatPrice((item.quantity * (item.price ?? 0)))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-sm">
              {order.itemTotal != null && order.itemTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>{t('orderDetail.subtotal')}</span>
                  <span>{formatPrice(order.itemTotal)}</span>
                </div>
              )}
              {order.promoTotal != null && order.promoTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('orderDetail.discount')}</span>
                  <span>-{formatPrice(order.promoTotal)}</span>
                </div>
              )}
              {order.shipmentTotal != null && order.shipmentTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>{t('orderDetail.shippingFee')}</span>
                  <span>{formatPrice(order.shipmentTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2">
                <span className="text-white">{t('orderDetail.total')}</span>
                <span className="text-emerald-400">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment / Shipment */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Truck size={18} className="text-indigo-400" /> {t('orderDetail.fulfillment')}
            </h2>

            {!shipment ? (
              <p className="text-slate-400 text-sm">{t('orderDetail.noShipment')}</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${getShipmentColor(shipment.state)}`}>
                    {t(`shipmentStates.${shipment.state}`, { defaultValue: shipment.state })}
                  </span>
                  {order.shippingMethod && (
                    <span className="text-sm text-slate-300">
                      {t('orderDetail.method')}: <strong>{order.shippingMethod.name}</strong>
                      {order.shippingMethod.estimatedDays ? ` (${order.shippingMethod.estimatedDays})` : ''}
                    </span>
                  )}
                  {shipment.shippedAt && (
                    <span className="text-xs text-slate-500">{t('orderDetail.shippedAt')}: {new Date(shipment.shippedAt).toLocaleString()}</span>
                  )}
                  {shipment.deliveredAt && (
                    <span className="text-xs text-slate-500">{t('orderDetail.deliveredAt')}: {new Date(shipment.deliveredAt).toLocaleString()}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">{t('orderDetail.carrierLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('orderDetail.carrierPlaceholder')}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">{t('orderDetail.trackingLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('orderDetail.trackingPlaceholder')}
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
                    {t('orderDetail.saveShipment')}
                  </button>
                  {allowedShipmentNext.includes('ready') && (
                    <button onClick={() => handleShipmentState('ready')} disabled={savingShipment} className="px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {t('orderDetail.markReady')}
                    </button>
                  )}
                  {allowedShipmentNext.includes('shipped') && (
                    <button onClick={() => handleShipmentState('shipped')} disabled={savingShipment} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {t('orderDetail.startShipping')}
                    </button>
                  )}
                  {allowedShipmentNext.includes('delivered') && (
                    <button onClick={() => handleShipmentState('delivered')} disabled={savingShipment} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {t('orderDetail.markDeliveredSuccess')}
                    </button>
                  )}
                  {allowedShipmentNext.includes('returned') && (
                    <button onClick={() => handleShipmentState('returned')} disabled={savingShipment} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {t('orderDetail.markReturned')}
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
              <User size={18} className="text-indigo-400" /> {t('orderDetail.customerInfo')}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.name')}</div>
                <div className="text-white font-medium">{order.recipientName || order.customer?.name || t('orderDetail.na')}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.email')}</div>
                <div className="text-white">{order.customer?.email || t('orderDetail.na')}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.phone')}</div>
                <div className="text-white">{order.recipientPhone || order.customer?.phoneNumber || t('orderDetail.na')}</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.shippingAddress')}</div>
                <div className="text-white">
                  {[order.shippingAddress, order.shippingCity, order.shippingProvince].filter(Boolean).join(', ') || t('orderDetail.na')}
                </div>
              </div>
              {order.shippingNote && (
                <div>
                  <div className="text-slate-400 mb-1">{t('orderDetail.note')}</div>
                  <div className="text-white">{order.shippingNote}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-indigo-400" /> {t('orderDetail.paymentInfo')}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.method')}</div>
                <div className="text-white font-medium uppercase">
                  {order.payments?.[0]?.paymentMethod?.name || order.paymentMethod || t('orderDetail.na')}
                </div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">{t('orderDetail.paymentStatus')}</div>
                <div className="text-white capitalize">{order.paymentState || (order.state === 'checkout' ? t('orderDetail.pending') : t('orderDetail.paid'))}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
