'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cart-store';
import { useRouter } from 'next/navigation';
import { SmartImage } from '../blocks/SmartImage';
import { formatPrice } from '../../lib/format';
import { useTranslations } from '@ecommerce/i18n/src/react';

export function CheckoutDefault({ shopInfo, shopSlug }: { shopInfo: any, shopSlug: string }) {
    const t = useTranslations('order');
    const { items, totalAmount, clearCart } = useCartStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [customerInfo, setCustomerInfo] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        note: ''
    });

    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState<string>('');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    // Shipping state
    const [shippingMethods, setShippingMethods] = useState<any[]>([]);
    const [shippingMethodId, setShippingMethodId] = useState<string>('');

    // Wallet state
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    // Tổng đã thanh toán — chốt trước khi clearCart để màn hình success không hiển thị 0đ
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<{
        valid: boolean; message: string; discount: number
    } | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    // Protect against empty cart
    useEffect(() => {
        if (items.length === 0 && !orderId) {
            router.push(`/${shopSlug}/all-products`);
        }
    }, [items, router, shopSlug, orderId]);

    // Authenticated calls (wallet, order checkout) go through the storefront BFF
    // at `/{shopSlug}/api/store/...`, which reads the httpOnly session cookie
    // server-side and attaches the Bearer token. The client can't read that
    // cookie, so it must not try to build the Authorization header itself.
    const bff = (path: string) => `/${shopSlug}/api/store/${path}`;

    // Fetch payment + shipping methods
    useEffect(() => {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const fetchPaymentMethods = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/payments/methods`, {
                    headers: { 'x-shop-id': shopInfo.id }
                });
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    setPaymentMethods(data.data);
                    setPaymentMethodId(data.data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch payment methods', err);
            }
        };

        const fetchShippingMethods = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/shipping/methods`, {
                    headers: { 'x-shop-id': shopInfo.id }
                });
                const data = await res.json();
                const methods = data.data || [];
                setShippingMethods(methods);
                if (methods.length > 0) setShippingMethodId(methods[0].id);
            } catch (err) {
                console.error('Failed to fetch shipping methods', err);
            }
        };

        const fetchWalletBalance = async () => {
            try {
                const res = await fetch(bff('wallet/me'), { cache: 'no-store' });
                if (!res.ok) return; // guests / not logged in → no wallet
                const data = await res.json();
                const balance = data?.balance ?? data?.data?.balance;
                if (typeof balance === 'number') setWalletBalance(balance);
            } catch (err) {
                console.error('Failed to fetch wallet balance', err);
            }
        };

        fetchPaymentMethods();
        fetchShippingMethods();
        fetchWalletBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopInfo.id]);

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${API_BASE}/api/promotions/validate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-shop-id': shopInfo.id 
                },
                body: JSON.stringify({
                    code: couponCode,
                    orderSubtotal: totalAmount
                })
            });
            const data = await res.json();
            if (res.ok && data.data?.valid) {
                setCouponStatus({
                    valid: true,
                    message: t('checkoutForm.couponDiscount', { amount: formatPrice(data.data.discountAmount) }),
                    discount: data.data.discountAmount
                });
            } else {
                setCouponStatus({
                    valid: false,
                    message: data.message || t('checkoutForm.couponInvalid'),
                    discount: 0
                });
            }
        } catch {
            setCouponStatus({ valid: false, message: t('checkoutForm.couponCheckError'), discount: 0 });
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Format order payload
            const payload = {
                paymentMethodId,
                lineItems: items.map((item: any) => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                })),
                promotionCode: couponStatus?.valid ? couponCode : undefined,
                shippingMethodId: shippingMethodId || undefined,
                shippingAddress: {
                    fullName: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
                    phone: customerInfo.phone,
                    addressLine1: customerInfo.address,
                    city: customerInfo.city,
                    note: customerInfo.note || undefined,
                },
            };

            const res = await fetch(bff('orders/checkout'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Placing an order requires an account. Guests build a cart freely but
            // must log in to check out — send them to login and back to checkout
            // (the guest cart merges into their account on login).
            if (res.status === 401) {
                router.push(`/${shopSlug}/account/login?redirect=/${shopSlug}/payment`);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || t('checkoutForm.failed'));
            }

            // API trả thẳng object order (một số bản cũ bọc trong { data })
            const order = data.id ? data : data.data;
            if (!order?.id) {
                throw new Error(data.message || t('checkoutForm.failed'));
            }

            setOrderId(order.id);
            setQrCodeUrl(order.qrCodeUrl || null);
            setPaidAmount(order.totalAmount ?? 0);
            clearCart();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    const selectedShippingMethod = shippingMethods.find(sm => sm.id === shippingMethodId);
    const shippingFee = selectedShippingMethod
        ? (selectedShippingMethod.freeThreshold != null && totalAmount >= selectedShippingMethod.freeThreshold
            ? 0
            : selectedShippingMethod.baseFee)
        : 0;
    const grandTotal = Math.max(0, totalAmount - (couponStatus?.discount || 0)) + shippingFee;
    const isWalletSelected = selectedPaymentMethod?.type === 'Wallet';
    const walletInsufficient = isWalletSelected && walletBalance != null && walletBalance < grandTotal;

    if (orderId) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
                <div className="bg-brand/10 text-brand w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                    ✓
                </div>
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('checkoutForm.orderConfirmed')}</h1>
                <p className="text-lg text-slate-600 mb-8">
                    {t('checkoutForm.orderPlacedDetail', { id: orderId.substring(0, 8) })}
                </p>
                {selectedPaymentMethod?.type === 'BankTransfer' && qrCodeUrl && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm mb-8">
                        <h3 className="font-bold text-xl mb-4">{t('checkoutForm.paymentInstructions')}</h3>
                        <p className="text-slate-600 mb-6">{t('checkoutForm.scanQr')}</p>
                        <div className="flex justify-center mb-6">
                            <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64 border rounded-lg shadow-sm" />
                        </div>
                        <div className="text-left bg-slate-50 p-6 rounded-xl space-y-3">
                            <p><strong>{t('checkoutForm.bank')}:</strong> {shopInfo.bankAccount?.bankName || 'N/A'}</p>
                            <p><strong>{t('checkoutForm.accountName')}:</strong> {shopInfo.bankAccount?.accountHolder || 'N/A'}</p>
                            <p><strong>{t('checkoutForm.accountNumber')}:</strong> <span className="font-mono font-bold text-brand">{shopInfo.bankAccount?.accountNumber || 'N/A'}</span></p>
                            <p><strong>{t('checkoutForm.amount')}:</strong> <span className="font-bold text-brand">{formatPrice(paidAmount)}</span></p>
                        </div>
                    </div>
                )}
                {selectedPaymentMethod?.type === 'BankTransfer' && !qrCodeUrl && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm mb-8">
                        <h3 className="font-bold text-xl mb-4">{t('checkoutForm.paymentInstructions')}</h3>
                        <p className="text-slate-600 mb-6">{t('checkoutForm.transferInstructions')}</p>
                        <div className="text-left bg-slate-50 p-6 rounded-xl space-y-3">
                            <p><strong>{t('checkoutForm.bank')}:</strong> {shopInfo.bankAccount?.bankName || 'N/A'}</p>
                            <p><strong>{t('checkoutForm.accountName')}:</strong> {shopInfo.bankAccount?.accountHolder || 'N/A'}</p>
                            <p><strong>{t('checkoutForm.accountNumber')}:</strong> <span className="font-mono font-bold text-brand">{shopInfo.bankAccount?.accountNumber || 'N/A'}</span></p>
                            <p><strong>{t('checkoutForm.amount')}:</strong> <span className="font-bold text-brand">{formatPrice(paidAmount)}</span></p>
                            <p><strong>{t('checkoutForm.transferNote')}:</strong> <span className="font-mono bg-yellow-100 px-2 py-1">ORDER {orderId.substring(0, 8)}</span></p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => router.push(`/${shopSlug}/all-products`)}
                    className="bg-brand text-white font-bold py-4 px-8 rounded-xl hover:bg-brand/90 transition-colors"
                >
                    {t('checkoutForm.continueShopping')}
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('checkout.title')}</h1>
            
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">{t('checkoutForm.contactInfo')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('checkoutForm.email')}</label>
                                <input 
                                    required type="email" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.email}
                                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('shipping.phone')}</label>
                                <input 
                                    required type="tel" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.phone}
                                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('shipping.firstName')}</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.firstName}
                                    onChange={e => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('shipping.lastName')}</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.lastName}
                                    onChange={e => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">{t('shipping.title')}</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('shipping.address')}</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.address}
                                    onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('checkoutForm.cityProvince')}</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    value={customerInfo.city}
                                    onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('checkoutForm.orderNotes')}</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand"
                                    rows={3}
                                    value={customerInfo.note}
                                    onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {shippingMethods.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-6">{t('shipping.shippingMethod')}</h2>
                            <div className="space-y-4">
                                {shippingMethods.map(sm => {
                                    const fee = sm.freeThreshold != null && totalAmount >= sm.freeThreshold ? 0 : sm.baseFee;
                                    return (
                                        <label key={sm.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${shippingMethodId === sm.id ? 'border-brand bg-brand/10' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value={sm.id}
                                                className="w-5 h-5 text-brand focus:ring-brand"
                                                checked={shippingMethodId === sm.id}
                                                onChange={() => setShippingMethodId(sm.id)}
                                            />
                                            <span className="ml-4 flex-1">
                                                <span className="font-medium">{sm.name}</span>
                                                {sm.estimatedDays && <span className="ml-2 text-sm text-slate-500">({sm.estimatedDays})</span>}
                                                {sm.description && <span className="block text-sm text-slate-500">{sm.description}</span>}
                                            </span>
                                            <span className={`font-bold ${fee === 0 ? 'text-brand' : 'text-slate-900'}`}>
                                                {fee === 0 ? t('checkoutForm.free') : `${formatPrice(fee)}`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">{t('payment.title')}</h2>
                        <div className="space-y-4">
                            {paymentMethods.length === 0 ? (
                                <div className="text-slate-500">{t('checkoutForm.noPaymentMethods')}</div>
                            ) : (
                                paymentMethods.map(pm => (
                                    <label key={pm.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethodId === pm.id ? 'border-brand bg-brand/10' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={pm.id}
                                            className="w-5 h-5 text-brand focus:ring-brand"
                                            checked={paymentMethodId === pm.id}
                                            onChange={() => setPaymentMethodId(pm.id)}
                                        />
                                        <span className="ml-4 font-medium">{pm.name}</span>
                                        {pm.description && <span className="ml-2 text-sm text-slate-500">({pm.description})</span>}
                                        {pm.type === 'Wallet' && walletBalance != null && (
                                            <span className="ml-auto text-sm font-bold text-brand">
                                                {t('checkoutForm.balance')}: {formatPrice(walletBalance)}
                                            </span>
                                        )}
                                    </label>
                                ))
                            )}
                            {walletInsufficient && (
                                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-sm border border-amber-200">
                                    {t('checkoutForm.walletInsufficient')}
                                </div>
                            )}
                            {isWalletSelected && walletBalance == null && (
                                <div className="bg-slate-50 text-slate-600 p-3 rounded-xl text-sm border border-slate-200">
                                    {t('checkoutForm.walletLoginPrompt')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3">
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sticky top-6">
                        <h2 className="text-xl font-bold mb-6">{t('review.orderSummary')}</h2>
                        <div className="space-y-4 mb-6">
                            {items.map((item: any) => (
                                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 relative">
                                        {item.imageUrl && <SmartImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" sizes="64px" />}
                                        <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                                        <div className="text-slate-500 text-sm mt-1">{formatPrice((item.price))}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4 mb-6">
                            <label className="text-sm font-medium text-slate-700 mb-2 block">{t('checkoutForm.discountCode')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand uppercase"
                                    placeholder={t('checkoutForm.enterCode')}
                                    value={couponCode}
                                    onChange={e => {
                                        setCouponCode(e.target.value.toUpperCase());
                                        if (couponStatus) setCouponStatus(null);
                                    }}
                                />
                                <button 
                                    type="button"
                                    onClick={handleValidateCoupon}
                                    disabled={validatingCoupon || !couponCode.trim()}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {validatingCoupon ? '...' : t('checkoutForm.apply')}
                                </button>
                            </div>
                            {couponStatus && (
                                <div className={`text-sm mt-2 ${couponStatus.valid ? 'text-brand' : 'text-red-600'}`}>
                                    {couponStatus.message}
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4 space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>{t('review.subtotal')}</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>
                            {couponStatus?.valid && (
                                <div className="flex justify-between text-brand">
                                    <span>{t('checkoutForm.discountWithCode', { code: couponCode })}</span>
                                    <span>-{formatPrice(couponStatus.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>{t('review.shipping')}{selectedShippingMethod ? ` (${selectedShippingMethod.name})` : ''}</span>
                                <span>{shippingFee === 0 ? t('checkoutForm.free') : `${formatPrice(shippingFee)}`}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl pt-3 border-t border-slate-200">
                                <span>{t('review.total')}</span>
                                <span className="text-brand">{formatPrice(grandTotal)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || paymentMethods.length === 0 || walletInsufficient}
                            className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin text-xl">◌</span> {t('checkoutForm.processing')}
                                </span>
                            ) : (
                                t('checkoutForm.pay', { amount: formatPrice(grandTotal) })
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
