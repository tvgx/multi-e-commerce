import { useState, useEffect } from 'react';

export function useAnalytics(shopId: string, period: '7d' | '30d' = '30d') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/api-core/orders/analytics?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': shopId
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        
        if (isMounted) {
          setData(json);
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
