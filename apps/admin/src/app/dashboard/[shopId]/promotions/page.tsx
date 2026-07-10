'use client';

import React, { useEffect, useState, use } from 'react';
import { usePromotions, Promotion } from '@/hooks/usePromotions';
import { Loader2, Ticket, Plus, Save, X, Trash2, Edit } from 'lucide-react';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export default function PromotionsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const t = useTranslations('admin');
  const { promotions, loading, error, fetchPromotions, createPromotion, updatePromotion, deletePromotion } = usePromotions(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    isActive: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData(promo);
    } else {
      setEditingPromo(null);
      setFormData({
        name: '',
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let success = false;
    if (editingPromo) {
      success = await updatePromotion(editingPromo.id, formData);
    } else {
      success = await createPromotion(formData);
    }
    if (success) {
      setIsModalOpen(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (
      await confirmDialog({
        title: t('promotions.deleteTitle'),
        message: t('promotions.deleteMessage'),
        confirmText: t('promotions.deleteConfirm'),
        danger: true,
      })
    ) {
      await deletePromotion(id);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('promotions.title')}</h1>
          <p className="text-slate-400">{t('promotions.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors font-bold"
        >
          <Plus size={18} /> {t('promotions.newPromotion')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && promotions.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-4" />
            <p className="text-slate-400">{t('promotions.loading')}</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-white/10">
            <Ticket className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">{t('promotions.none')}</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
              {t('promotions.createFirst')}
            </button>
          </div>
        ) : (
          promotions.map((promo) => (
            <div key={promo.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group overflow-hidden">
              <div className={`absolute top-0 right-0 w-2 h-full ${promo.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-mono font-bold text-xl text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    {promo.code}
                  </span>
                  <div className="text-emerald-400 font-medium mt-3">
                    {promo.discountType === 'percentage' ? t('promotions.percentOff', { value: promo.discountValue }) : t('promotions.amountOff', { value: formatPrice(promo.discountValue) })}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(promo)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 bg-white/5 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-400">
                <p>{t('promotions.statusLabel')} <span className={promo.isActive ? 'text-emerald-400' : 'text-slate-500'}>{promo.isActive ? t('promotions.active') : t('promotions.inactive')}</span></p>
                <p>{t('promotions.usedTimes', { count: promo.usedCount || 0 })}</p>
                {promo.usageLimit && <p>{t('promotions.limitUses', { count: promo.usageLimit })}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-white">{editingPromo ? t('promotions.editTitle') : t('promotions.newPromotion')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="promoForm" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('promotions.nameLabel')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={t('promotions.namePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('promotions.codeLabel')}</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                    placeholder={t('promotions.codePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{t('promotions.typeLabel')}</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value as any})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="percentage">{t('promotions.typePercentage')}</option>
                      <option value="fixed">{t('promotions.typeFixed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{t('promotions.valueLabel')}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('promotions.usageLimitLabel')}</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || undefined})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={t('promotions.usageLimitPlaceholder')}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                    {t('promotions.activeCheckbox')}
                  </label>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-800 shrink-0 flex gap-3 bg-slate-900/50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
              >
                {t('promotions.cancel')}
              </button>
              <button 
                type="submit"
                form="promoForm"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t('promotions.savePromotion')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
