import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Order {
  id: string;
  number: string;
  customerId: string | null;
  shopId: string;
  state: 'checkout' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'canceled' | 'refunded';
  totalAmount: number;
  paymentMethod: string;
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
      const res = await apiClient.get<Order[]>(`/api/orders?shopId=${shopId}`);
      setOrders(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const fetchOrderById = useCallback(async (orderId: string) => {
    const res = await apiClient.get<Order>(`/api/orders/${orderId}`);
    return res.data;
  }, []);

  const updateOrderStatus = async (orderId: string, newState: Order['state']) => {
    try {
      await apiClient.patch(`/api/orders/${orderId}/status`, { state: newState });
      setOrders((prev) => 
        prev.map((order) => (order.id === orderId ? { ...order, state: newState } : order))
      );
      return true;
    } catch (err: any) {
      alert(`Failed to update order status: ${err.message}`);
      return false;
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    updateOrderStatus
  };
}
