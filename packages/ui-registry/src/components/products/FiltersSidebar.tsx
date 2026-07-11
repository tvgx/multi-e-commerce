'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { NumberInput } from '../blocks/NumberInput';

interface FiltersSidebarProps {
  // Lọc theo id (giá trị lưu trên URL), hiển thị theo name
  categories?: { id: string; name: string }[];
}

export function FiltersSidebar({ categories = [] }: FiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('shop');
  const tc = useTranslations('common');

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

  const handleCategoryChange = (categoryId: string) => {
    const newVal = currentCategory === categoryId ? '' : categoryId;
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
          <h3 className="font-bold mb-4 text-slate-800">{t('filters.category')}</h3>
          <div className="space-y-3 text-sm text-slate-600">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand transition-colors"
                  checked={currentCategory === cat.id}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                <span className="group-hover:text-brand transition-colors">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-bold mb-4 text-slate-800">{t('filters.price')}</h3>
        <div className="flex items-center gap-2 mb-3">
          <NumberInput
            min={0}
            placeholder={tc('labels.min')}
            value={Number(minPrice) || null}
            onValueChange={(v) => setMinPrice(v != null ? String(v) : '')}
            wrapperClassName="w-full"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <span className="text-slate-400">-</span>
          <NumberInput
            min={0}
            placeholder={tc('labels.max')}
            value={Number(maxPrice) || null}
            onValueChange={(v) => setMaxPrice(v != null ? String(v) : '')}
            wrapperClassName="w-full"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button 
          onClick={handlePriceApply}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg text-sm transition-colors"
        >
          {t('filters.apply')}
        </button>
      </div>
    </aside>
  );
}
