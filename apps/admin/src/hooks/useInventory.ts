import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface InventoryItem {
  id: string;
  name: string;
  basePrice: number;
  variants: {
    id: string;
    sku: string;
    attributes: Record<string, string>;
    stock: number;
  }[];
}

export function useInventory(shopId: string) {
  const t = useTranslations('admin');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, there might be a dedicated inventory API.
      // We reuse the products API here and just map the data.
      const res = await apiClient.get<any>(`/api/catalog/products/shop/${shopId}`);
      // Assuming response data is an array of products
      const products = res.data.data || res.data;
      setItems(products);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const adjustStock = async (productId: string, variantId: string, newStock: number) => {
    try {
      // Find the product
      const product = items.find(p => p.id === productId || (p as any)._id === productId);
      if (!product) throw new Error(t('hooks.inventoryProductNotFound'));

      // Update the specific variant stock locally first or send full variants array
      const updatedVariants = product.variants.map(v => 
        (v.id === variantId || (v as any)._id === variantId) ? { ...v, stock: newStock } : v
      );

      // Send update to API (assuming the backend supports partial update or we just send the variants array)
      await apiClient.patch(`/api/catalog/products/${productId}`, { variants: updatedVariants });

      // Update local state
      setItems(prev => prev.map(p => 
        (p.id === productId || (p as any)._id === productId) ? { ...p, variants: updatedVariants } : p
      ));

      return true;
    } catch (err: any) {
      toast.error(t('hooks.inventoryAdjustFailed', { msg: err.message }));
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    fetchInventory,
    adjustStock
  };
}
