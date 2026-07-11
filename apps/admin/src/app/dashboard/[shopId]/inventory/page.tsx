'use client';

import React, { useEffect, useState, use } from 'react';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { Loader2, PackageOpen, RefreshCw, Save, X } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { NumberInput } from '@ecommerce/ui-registry/src/components/blocks/NumberInput';

export default function InventoryPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const t = useTranslations('admin');
  const { items, loading, error, fetchInventory, adjustStock } = useInventory(shopId);

  const [editingVariant, setEditingVariant] = useState<{productId: string, variantId: string, currentStock: number} | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAdjustClick = (productId: string, variantId: string, currentStock: number) => {
    setEditingVariant({ productId, variantId, currentStock });
    setNewStock(currentStock);
  };

  const handleSave = async () => {
    if (!editingVariant) return;
    setSaving(true);
    const success = await adjustStock(editingVariant.productId, editingVariant.variantId, newStock);
    if (success) {
      setEditingVariant(null);
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('inventory.title')}</h1>
          <p className="text-slate-400">{t('inventory.subtitle')}</p>
        </div>
        <button
          onClick={() => fetchInventory()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('inventory.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t('inventory.colProduct')}</th>
                <th className="px-6 py-4 font-medium">{t('inventory.colSku')}</th>
                <th className="px-6 py-4 font-medium">{t('inventory.colAttributes')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('inventory.colInStock')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('inventory.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-4" />
                    <p className="text-slate-400">{t('inventory.loading')}</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <PackageOpen className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">{t('inventory.noProducts')}</p>
                  </td>
                </tr>
              ) : (
                items.flatMap(product => {
                  const pId = (product as any)._id || product.id;
                  
                  if (!product.variants || product.variants.length === 0) {
                    return (
                      <tr key={pId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                        <td className="px-6 py-4 text-slate-500 italic">{t('inventory.noVariants')}</td>
                        <td className="px-6 py-4 text-slate-500">-</td>
                        <td className="px-6 py-4 text-right">-</td>
                        <td className="px-6 py-4 text-right"></td>
                      </tr>
                    );
                  }

                  return product.variants.map(variant => {
                    const vId = (variant as any)._id || variant.id;
                    const stock = variant.stock ?? 0;
                    const isLowStock = stock < 10;
                    const isOutStock = stock === 0;

                    return (
                      <tr key={`${pId}-${vId}`} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                        <td className="px-6 py-4 font-mono">{variant.sku || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {variant.attributes ? (
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(variant.attributes).map(([k, v]) => (
                                <span key={k} className="px-2 py-0.5 bg-slate-800 text-xs rounded-md">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">{t('inventory.default')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${isOutStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-400'}`}>
                            {stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleAdjustClick(pId, vId, stock)}
                            className="px-3 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded text-xs font-bold transition-colors"
                          >
                            {t('inventory.adjust')}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{t('inventory.adjustStock')}</h2>
              <button onClick={() => setEditingVariant(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t('inventory.newStockQty')}</label>
                <NumberInput
                  min={0}
                  allowDecimal={false}
                  value={newStock}
                  onValueChange={(v) => setNewStock(v ?? 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('inventory.currentStock')}</span>
                <span className="text-slate-300 font-bold">{editingVariant.currentStock}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEditingVariant(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
              >
                {t('inventory.cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || newStock < 0}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('inventory.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
