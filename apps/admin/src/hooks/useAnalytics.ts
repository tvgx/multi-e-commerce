import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useAnalytics(shopId: string, period: '7d' | '30d' = '30d') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(`/api/orders/analytics?period=${period}`, {
          shopId
        });

        if (isMounted) {
          setData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (shopId) {
      fetchAnalytics();
    }

    return () => { isMounted = false; };
  }, [shopId, period]);

  return { data, loading, error };
}
