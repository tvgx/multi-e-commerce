import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';

// PROMO-1: field names phải khớp BE (DTO + Prisma + order.createOrder).
// Trước đây FE dùng type/value/startDate/minOrderValue — không khớp DB nên
// tạo/sửa khuyến mãi âm thầm hỏng. discountType là lowercase 'percentage'|'fixed'
// (đúng theo order.createOrder & validate()); không có cột minOrderValue/maxDiscount.
export interface Promotion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  shopId: string;
}

export function usePromotions(shopId: string) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Promotion[]>(`/api/promotions?shopId=${shopId}`);
      setPromotions(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const createPromotion = async (data: Partial<Promotion>) => {
    try {
      const res = await apiClient.post<Promotion>(`/api/promotions`, { ...data, shopId });
      setPromotions(prev => [res.data, ...prev]);
      return true;
    } catch (err: any) {
      toast.error(`Failed to create promotion: ${err.message}`);
      return false;
    }
  };

  const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    try {
      const res = await apiClient.patch<Promotion>(`/api/promotions/${id}`, data);
      setPromotions(prev => prev.map(p => (p.id === id ? res.data : p)));
      return true;
    } catch (err: any) {
      toast.error(`Failed to update promotion: ${err.message}`);
      return false;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await apiClient.delete(`/api/promotions/${id}`);
      setPromotions(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      toast.error(`Failed to delete promotion: ${err.message}`);
      return false;
    }
  };

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
  };
}
