import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Collection {
  id: string;
  shopId: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  products?: any[];
  _count?: { products: number };
}

export function useCollections(shopId: string) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Collection[]>(`/api/catalog/collections?shopId=${shopId}`);
      setCollections(res.data || []);
    } catch (err: any) {
      if (err.message !== "No Data or end of list data") {
        setError(err.message || "Failed to fetch collections");
      }
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const createCollection = async (data: Partial<Collection>) => {
    setError(null);
    try {
      const res = await apiClient.post<Collection>(`/api/catalog/collections`, data, { shopId });
      setCollections(prev => [...prev, res.data]);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to create collection");
      throw err;
    }
  };

  const updateCollection = async (id: string, data: Partial<Collection>) => {
    setError(null);
    try {
      const res = await apiClient.patch<Collection>(`/api/catalog/collections/${id}`, data, { shopId });
      setCollections(prev => prev.map(c => c.id === id ? { ...c, ...res.data } : c));
      return res.data;
    } catch (err: any) {
      setError(err.message || "Failed to update collection");
      throw err;
    }
  };

  const getCollectionDetails = async (slug: string) => {
    try {
      const res = await apiClient.get<Collection>(`/api/catalog/collections/${slug}?shopId=${shopId}`);
      return res.data;
    } catch (err: any) {
      throw err;
    }
  };

  const addProductsToCollection = async (id: string, productIds: string[]) => {
    try {
      await apiClient.post(`/api/catalog/collections/${id}/products`, { productIds }, { shopId });
    } catch (err: any) {
      throw err;
    }
  };

  const removeProductFromCollection = async (id: string, productId: string) => {
    try {
      await apiClient.delete(`/api/catalog/collections/${id}/products/${productId}`, { shopId });
    } catch (err: any) {
      throw err;
    }
  };

  return {
    collections,
    loading,
    error,
    fetchCollections,
    createCollection,
    updateCollection,
    getCollectionDetails,
    addProductsToCollection,
    removeProductFromCollection,
  };
}
