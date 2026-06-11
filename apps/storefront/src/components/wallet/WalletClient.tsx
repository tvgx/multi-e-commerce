'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface WalletData {
    id: string;
    balance: number;
    pendingTopups: { id: string; amount: number; status: string; createdAt: string; expiresAt: string }[];
}

interface TxRow {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    note?: string | null;
    createdAt: string;
}

const TX_TYPE_LABELS: Record<string, string> = {
    deposit: 'Nạp tiền',
    payment: 'Thanh toán đơn hàng',
    refund: 'Hoàn tiền',
    adjustment: 'Điều chỉnh từ cửa hàng',
};

const QUICK_AMOUNTS = [100000, 200000, 500000];

export function WalletClient({ shopInfo, shopSlug }: { shopInfo: any; shopSlug: string }) {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [txs, setTxs] = useState<TxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Topup state
    const [topupAmount, setTopupAmount] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [topupResult, setTopupResult] = useState<any>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const getToken = useCallback(() => document.cookie.split(';')
        .find(c => c.trim().startsWith(`shop_session_${shopSlug}=`))
        ?.split('=')[1], [shopSlug]);

    const authHeaders = useCallback((): Record<string, string> => ({
        'x-shop-id': shopInfo.id,
        'Authorization': `Bearer ${getToken() || ''}`,
    }), [shopInfo.id, getToken]);

    const fetchWallet = useCallback(async () => {
        try {
            const [walletRes, txRes] = await Promise.all([
                fetch(`${API_BASE}/api/wallet/me`, { headers: authHeaders() }),
                fetch(`${API_BASE}/api/wallet/me/transactions?limit=30`, { headers: authHeaders() }),
            ]);
            if (!walletRes.ok) {
                const body = await walletRes.json().catch(() => ({}));
                throw new Error(body.message || 'Không tải được thông tin ví');
            }
            const walletData = await walletRes.json();
            setWallet(walletData);

            if (txRes.ok) {
                const txData = await txRes.json();
                setTxs(txData.data || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_BASE, authHeaders]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(topupAmount);
        if (!amount || amount < 1000) {
            alert('Số tiền nạp tối thiểu là 1.000đ');
            return;
        }
        setRequesting(true);
        try {
            const res = await fetch(`${API_BASE}/api/wallet/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không tạo được yêu cầu nạp tiền');
            setTopupResult(data);
            setTopupAmount('');
            await fetchWallet();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center text-slate-500">
                Đang tải ví của bạn...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-xl text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-6">{error}</div>
                <Link href={`/${shopSlug}/account/login`} className="text-emerald-600 font-medium hover:underline">
                    Đăng nhập lại
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Ví của tôi</h1>
                <Link href={`/${shopSlug}/profile`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    ← Tài khoản
                </Link>
            </div>

            {/* Balance card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-3xl p-8 shadow-lg">
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">Số dư khả dụng</p>
                <p className="text-5xl font-extrabold">{(wallet?.balance ?? 0).toLocaleString('vi-VN')}đ</p>
                <p className="text-emerald-100 text-sm mt-3">
                    Dùng để thanh toán đơn hàng tại {shopInfo.name}. Tiền hoàn từ đơn huỷ cũng được cộng vào đây.
                </p>
            </div>

            {/* Topup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-xl font-bold text-slate-800">Nạp tiền vào ví</h2>

                {topupResult ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl">
                            Đã tạo yêu cầu nạp <strong>{topupResult.amount?.toLocaleString('vi-VN')}đ</strong>.
                            Vui lòng chuyển khoản theo thông tin dưới đây, sau đó cửa hàng sẽ xác nhận và cộng tiền vào ví.
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            {topupResult.qrCodeUrl && (
                                <img src={topupResult.qrCodeUrl} alt="Topup QR" className="w-48 h-48 border rounded-xl shadow-sm" />
                            )}
                            <div className="flex-1 bg-slate-50 p-5 rounded-xl space-y-2 text-sm w-full">
                                <p><strong>Ngân hàng:</strong> {topupResult.bankAccount?.bankName || 'Liên hệ cửa hàng'}</p>
                                <p><strong>Chủ tài khoản:</strong> {topupResult.bankAccount?.accountHolder || 'N/A'}</p>
                                <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-emerald-600">{topupResult.bankAccount?.accountNumber || 'N/A'}</span></p>
                                <p><strong>Số tiền:</strong> <span className="font-bold text-emerald-600">{topupResult.amount?.toLocaleString('vi-VN')}đ</span></p>
                                <p><strong>Nội dung CK:</strong> <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">NAP VI {String(topupResult.id || '').substring(0, 8).toUpperCase()}</span></p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTopupResult(null)}
                            className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                            Tạo yêu cầu khác
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
                                    className={`px-4 py-2 rounded-xl border font-medium text-sm transition-colors ${topupAmount === String(a) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {a.toLocaleString('vi-VN')}đ
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                min={1000}
                                step={1000}
                                placeholder="Hoặc nhập số tiền khác..."
                                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                value={topupAmount}
                                onChange={e => setTopupAmount(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={requesting}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
                            >
                                {requesting ? 'Đang tạo...' : 'Nạp tiền'}
                            </button>
                        </div>
                    </form>
                )}

                {wallet?.pendingTopups && wallet.pendingTopups.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                        <p className="text-sm font-medium text-slate-700">Yêu cầu đang chờ xác nhận:</p>
                        {wallet.pendingTopups.map(t => (
                            <div key={t.id} className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
                                <span className="text-amber-800">
                                    Nạp <strong>{t.amount.toLocaleString('vi-VN')}đ</strong> · {new Date(t.createdAt).toLocaleString('vi-VN')}
                                </span>
                                <span className="text-xs font-bold text-amber-600 uppercase">Chờ xác nhận</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Lịch sử giao dịch</h2>
                {txs.length === 0 ? (
                    <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-200">
                        Chưa có giao dịch nào.
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
                        {txs.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center px-6 py-4">
                                <div>
                                    <p className="font-medium text-slate-800">{TX_TYPE_LABELS[tx.type] || tx.type}</p>
                                    {tx.note && <p className="text-sm text-slate-500">{tx.note}</p>}
                                    <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                                    </p>
                                    <p className="text-xs text-slate-400">Số dư: {tx.balanceAfter.toLocaleString('vi-VN')}đ</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
