import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';

export interface Shipment {
  id: string;
  state: 'pending' | 'ready' | 'shipped' | 'delivered' | 'returned' | 'canceled';
  carrier?: string | null;
  trackingNumber?: string | null;
  note?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  shippingMethod?: { id: string; name: string } | null;
}

export interface Order {
  id: string;
  number: string;
  customerId: string | null;
  shopId: string;
  state: 'checkout' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'canceled' | 'refunded';
  paymentState?: string;
  shipmentState?: string;
  totalAmount: number;
  itemTotal?: number;
  promoTotal?: number;
  shipmentTotal?: number;
  paymentMethod: string;
  customer?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  payments?: { id: string; state: string; amount: number; paymentMethod?: { name: string; type: string } }[];
  shippingMethod?: { id: string; name: string; estimatedDays?: string | null } | null;
  shipments?: Shipment[];
  recipientName?: string | null;
  recipientPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingNote?: string | null;
  customerInfo?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  lineItems: any[];
  createdAt: string;
}

export function useOrders(shopId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Order[]>(`/api/orders?shopId=${shopId}`, { shopId });
      setOrders(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const fetchOrderById = useCallback(async (orderId: string) => {
    // Endpoint trả thẳng object order (không có wrapper { data })
    const res: any = await apiClient.get<Order>(`/api/orders/${orderId}`, { shopId });
    return (res?.data ?? res) as Order;
  }, [shopId]);

  const updateOrderStatus = async (orderId: string, newState: Order['state']) => {
    try {
      // API nhận field `status` (UpdateOrderStatusDto)
      await apiClient.patch(`/api/orders/${orderId}/status`, { status: newState }, { shopId });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, state: newState } : order))
      );
      return true;
    } catch (err: any) {
      toast.error(`Failed to update order status: ${err.message}`);
      return false;
    }
  };

  const updateShipment = async (
    shipmentId: string,
    data: { state?: string; carrier?: string; trackingNumber?: string; note?: string }
  ) => {
    const res: any = await apiClient.patch<Shipment>(`/api/shipping/shipments/${shipmentId}`, data, { shopId });
    return (res?.data ?? res) as Shipment;
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    updateOrderStatus,
    updateShipment
  };
}
