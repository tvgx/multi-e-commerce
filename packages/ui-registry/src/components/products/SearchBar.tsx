'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(searchParams.toString());
      if (query) {
        currentParams.set('q', query);
      } else {
        currentParams.delete('q');
        currentParams.delete('search'); // clean up old 'search' param
      }
      // If we are not on all-products page, pushing might be better handled on enter,
      // but for now, we debounce and push to /all-products
      if (query && shopSlug) {
        // We only want to auto-redirect to all-products if they are typing, or we can just keep them on current page if we want.
        // Usually, debounce search is used ON the search page.
        // Let's check if window is already at all-products
        if (window.location.pathname.includes('/all-products')) {
          router.replace(`/${shopSlug}/all-products?${currentParams.toString()}`, { scroll: false });
        }
      } else if (!query && shopSlug && window.location.pathname.includes('/all-products')) {
          router.replace(`/${shopSlug}/all-products?${currentParams.toString()}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchParams, shopSlug, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopSlug) {
      router.push(`/${shopSlug}/all-products?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-xl px-8 hidden md:block">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full bg-slate-100 border-none rounded-full px-6 py-2 text-sm focus:ring-2 outline-none transition-shadow"
        style={{ '--tw-ring-color': 'var(--primary-color, #10b981)' } as React.CSSProperties}
      />
    </form>
  );
}
