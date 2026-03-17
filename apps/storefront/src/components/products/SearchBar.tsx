'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?${createQueryString('search', query)}`);
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
