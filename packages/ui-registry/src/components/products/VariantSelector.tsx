'use client';
import React, { useState, useEffect } from 'react';

export interface Variant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrl?: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  // Extract unique attribute types: ['Size', 'Color']
  const attributeKeys = [...new Set(variants.flatMap(v => Object.keys(v.attributes || {})))];
  
  // Group: { Size: ['S', 'M', 'L'], Color: ['Red', 'Blue'] }
  const grouped = attributeKeys.reduce((acc, key) => ({
    ...acc,
    [key]: [...new Set(variants.map(v => v.attributes?.[key]).filter(Boolean))]
  }), {} as Record<string, string[]>);
  
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  
  // Find matching variant
  const matchedVariant = variants.find(v => 
    Object.entries(selectedAttrs).every(([k, val]) => v.attributes?.[k] === val)
  );
  
  useEffect(() => {
    if (matchedVariant) onSelect(matchedVariant.id);
  }, [matchedVariant, onSelect]);
  
  if (variants.length <= 1) return null; // If no variants or just 1, don't show the selector

  return (
    <div className="space-y-4 my-6">
      {Object.entries(grouped).map(([attrName, values]) => (
        <div key={attrName}>
          <h4 className="font-medium mb-2 text-slate-800">{attrName}: <span className="text-slate-500 font-normal">{selectedAttrs[attrName] || 'Chọn...'}</span></h4>
          <div className="flex gap-2 flex-wrap">
            {values.map(val => {
              const variantsWithValue = variants.filter(v => v.attributes?.[attrName] === val);
              const outOfStock = variantsWithValue.every(v => (v.stock || 0) <= 0);
              return (
                <button
                  key={val}
                  disabled={outOfStock}
                  onClick={() => setSelectedAttrs(prev => ({...prev, [attrName]: val}))}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all
                    ${selectedAttrs[attrName] === val ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 hover:border-slate-400 bg-white text-slate-700'}
                    ${outOfStock ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
