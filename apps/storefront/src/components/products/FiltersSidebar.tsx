'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

interface FiltersSidebarProps {
  categories: string[];
}

export default function FiltersSidebar({ categories }: FiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  // Convert these directly to numbers or strings
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

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

  const handleCategoryChange = (category: string) => {
    const newVal = currentCategory === category ? '' : category;
    router.push(`?${createQueryString('category', newVal)}`);
  };

  const handlePriceApply = () => {
    let params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    router.push(`?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 space-y-8 shrink-0">
      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-bold mb-4 text-slate-800">Categories</h3>
          <div className="space-y-3 text-sm text-slate-600">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                  checked={currentCategory === cat}
                  onChange={() => handleCategoryChange(cat)}
                />
                <span className="group-hover:text-emerald-600 transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-bold mb-4 text-slate-800">Price Range</h3>
        <div className="flex items-center gap-2 mb-3">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
          <span className="text-slate-400">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <button 
          onClick={handlePriceApply}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Apply Price Filter
        </button>
      </div>
    </aside>
  );
}
