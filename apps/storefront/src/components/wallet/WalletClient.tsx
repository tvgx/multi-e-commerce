'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { useTranslations, useLocale } from '@ecommerce/i18n/src/react';
import { useWallet } from '@/hooks/useWallet';

const QUICK_AMOUNTS = [100000, 200000, 500000];

export function WalletClient({ shopInfo, shopSlug }: { shopInfo: any; shopSlug: string }) {
    const t = useTranslations('shop');
    const locale = useLocale();
    const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

    const {
        wallet,
        txs,
        loading,
        error,
        requesting,
        topupResult,
        clearTopupResult,
        requestTopup,
    } = useWallet(shopInfo.id, shopSlug);

    // Form input is the only piece of local UI state left in the view.
    const [topupAmount, setTopupAmount] = useState('');

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await requestTopup(Number(topupAmount));
        if (ok) setTopupAmount('');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center text-slate-500">
                {t('wallet.loadingWallet')}
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-xl text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-6">{error}</div>
                <Link href={`/${shopSlug}/account/login`} className="text-brand font-medium hover:underline">
                    {t('wallet.loginAgain')}
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">{t('wallet.title')}</h1>
                <Link href={`/${shopSlug}/profile`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    {t('wallet.backToAccount')}
                </Link>
            </div>

            {/* Balance card */}
            <div className="bg-gradient-to-br from-brand to-brand/70 text-white rounded-3xl p-8 shadow-lg">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">{t('wallet.availableBalance')}</p>
                <p className="text-5xl font-extrabold">{formatPrice((wallet?.balance ?? 0))}</p>
                <p className="text-white/80 text-sm mt-3">
                    {t('wallet.balanceDescription', { shop: shopInfo.name })}
                </p>
            </div>

            {/* Topup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-xl font-bold text-slate-800">{t('wallet.topupTitle')}</h2>

                {topupResult ? (
                    <div className="space-y-4">
                        <div className="bg-brand/10 border border-brand/20 text-brand p-4 rounded-xl">
                            {t('wallet.topupCreated', { amount: formatPrice(topupResult.amount) })}
                            {' '}{t('wallet.topupInstructions')}
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 bg-slate-50 p-5 rounded-xl space-y-2 text-sm w-full">
                                <p><strong>{t('wallet.bankLabel')}</strong> {topupResult.bankAccount?.bankName || 'N/A'}</p>
                                <p><strong>{t('wallet.accountHolder')}</strong> {topupResult.bankAccount?.accountHolder || 'N/A'}</p>
                                <p><strong>{t('wallet.accountNumberLabel')}</strong> <span className="font-mono font-bold text-brand">{topupResult.bankAccount?.accountNumber || 'N/A'}</span></p>
                                <p><strong>{t('wallet.amountLabel')}</strong> <span className="font-bold text-brand">{formatPrice(topupResult.amount)}</span></p>
                                <p><strong>{t('wallet.transferNoteLabel')}</strong> <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">NAP VI {String(topupResult.id || '').substring(0, 8).toUpperCase()}</span></p>
                            </div>
                        </div>
                        <button
                            onClick={clearTopupResult}
                            className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                            {t('wallet.createAnother')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleTopup} className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                            {QUICK_AMOUNTS.map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setTopupAmount(String(a))}
                                    className={`px-4 py-2 rounded-xl border font-medium text-sm transition-colors ${topupAmount === String(a) ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {formatPrice(a)}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                min={1000}
                                step={1000}
                                placeholder={t('wallet.enterOtherAmount')}
                                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                value={topupAmount}
                                onChange={e => setTopupAmount(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={requesting}
                                className="px-6 py-3 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
                            >
                                {requesting ? t('wallet.topupProcessing') : t('wallet.topupButton')}
                            </button>
                        </div>
                    </form>
                )}

                {wallet?.pendingTopups && wallet.pendingTopups.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                        <p className="text-sm font-medium text-slate-700">{t('wallet.pendingRequests')}</p>
                        {wallet.pendingTopups.map(pt => (
                            <div key={pt.id} className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
                                <span className="text-amber-800">
                                    {t('wallet.depositLabel')} <strong>{formatPrice(pt.amount)}</strong> · {new Date(pt.createdAt).toLocaleString(intlLocale)}
                                </span>
                                <span className="text-xs font-bold text-amber-600 uppercase">{t('wallet.pendingStatus')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('wallet.txHistory')}</h2>
                {txs.length === 0 ? (
                    <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-200">
                        {t('wallet.noTransactions')}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
                        {txs.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center px-6 py-4">
                                <div>
                                    <p className="font-medium text-slate-800">{t(`txTypes.${tx.type}`, { defaultValue: tx.type })}</p>
                                    {tx.note && <p className="text-sm text-slate-500">{tx.note}</p>}
                                    <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString(intlLocale)}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.amount >= 0 ? 'text-brand' : 'text-rose-600'}`}>
                                        {tx.amount >= 0 ? '+' : ''}{formatPrice(tx.amount)}
                                    </p>
                                    <p className="text-xs text-slate-400">{t('wallet.balanceAfter')} {formatPrice(tx.balanceAfter)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
