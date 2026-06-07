'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // We call the verify-session endpoint (which we just added/mocked)
        // In a real scenario, this would use better-auth client hooks
        const res = await apiClient.get<any>('/api/auth/verify-session');
        if (res.data.authenticated) {
          setAuthenticated(true);
          
          // PHASE 2: Onboarding Redirect Logic
          // Check if user has any shops. If not, and they are not already on /create-shop, redirect them.
          if (pathname !== '/create-shop' && !pathname.startsWith('/dashboard/')) {
            try {
              const shopsRes = await apiClient.get<any[]>('/api/shops/my-shops');
              if ((shopsRes.data?.length ?? 0) === 0) {
                router.push('/create-shop');
              }
            } catch (shopErr) {
              console.error('Failed to fetch shops during onboarding check:', shopErr);
            }
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}
