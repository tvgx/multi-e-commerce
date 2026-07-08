import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  basePrice: number;
  inStock: number;
  images: string[];
  variants?: any[];
  collections?: { collection: { id: string, title: string, slug: string } }[];
  extraMetadata?: any;
}

export function useProducts(shopId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (searchQuery: string = '') => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/catalog/products/shop/${shopId}` + (searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '');
      const res = await apiClient.get<any>(url, { shopId });
      setProducts(res.data?.data || []);
    } catch (err: any) {
      if (err.message !== "No Data or end of list data") {
        setError(err.message || "Failed to fetch products");
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const fetchProductById = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Product>(`/api/catalog/products/${productId}`, { shopId });
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const createProduct = async (data: any) => {
    setError(null);
    try {
      const res = await apiClient.post<Product>(`/api/catalog/products`, data, { shopId });
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      throw err;
    }
  };

  const updateProduct = async (id: string, data: any) => {
    setError(null);
    try {
      const res = await apiClient.patch<Product>(`/api/catalog/products/${id}`, data, { shopId });
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to update product");
      throw err;
    }
  };

  // Server soft-delete (status → ARCHIVED), sản phẩm biến mất khỏi storefront.
  const deleteProduct = async (id: string) => {
    setError(null);
    try {
      const res = await apiClient.delete<Product>(`/api/catalog/products/${id}`, { shopId });
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
