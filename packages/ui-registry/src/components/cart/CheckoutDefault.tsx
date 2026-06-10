'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cart-store';
import { useRouter } from 'next/navigation';
import { SmartImage } from '../blocks/SmartImage';

export function CheckoutDefault({ shopInfo, shopSlug }: { shopInfo: any, shopSlug: string }) {
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

    // Fetch payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
        fetchPaymentMethods();
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
                    message: `✅ Giảm ${data.data.discountAmount.toLocaleString('vi-VN')}đ`, 
                    discount: data.data.discountAmount 
                });
            } else {
                setCouponStatus({ 
                    valid: false, 
                    message: data.message || 'Mã không hợp lệ', 
                    discount: 0 
                });
            }
        } catch {
            setCouponStatus({ valid: false, message: 'Không thể kiểm tra mã', discount: 0 });
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            
            // Get token from cookie
            const token = document.cookie.split(';')
              .find(c => c.trim().startsWith(`shop_session_${shopSlug}=`))
              ?.split('=')[1];

            // Format order payload
            const payload = {
                paymentMethodId,
                lineItems: items.map((item: any) => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                })),
                customerInfo,
                shippingFee: 0,
                promotionCode: couponStatus?.valid ? couponCode : undefined,
            };

            const res = await fetch(`${API_BASE}/api/orders/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-shop-id': shopInfo.id,
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Checkout failed');
            }

            setOrderId(data.data.id);
            setQrCodeUrl(data.data.qrCodeUrl || null);
            clearCart();
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

    if (orderId) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
                <div className="bg-emerald-50 text-emerald-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                    ✓
                </div>
                <h1 className="text-4xl font-bold text-slate-900 mb-4">Order Confirmed!</h1>
                <p className="text-lg text-slate-600 mb-8">
                    Your order #{orderId.substring(0, 8)} has been placed successfully.
                </p>
                {selectedPaymentMethod?.type === 'BankTransfer' && qrCodeUrl && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm mb-8">
                        <h3 className="font-bold text-xl mb-4">Payment Instructions</h3>
                        <p className="text-slate-600 mb-6">Please scan the QR code below to complete your payment:</p>
                        <div className="flex justify-center mb-6">
                            <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64 border rounded-lg shadow-sm" />
                        </div>
                        <div className="text-left bg-slate-50 p-6 rounded-xl space-y-3">
                            <p><strong>Bank:</strong> {shopInfo.bankAccount?.bankName || 'N/A'}</p>
                            <p><strong>Account Name:</strong> {shopInfo.bankAccount?.accountHolder || 'N/A'}</p>
                            <p><strong>Account Number:</strong> <span className="font-mono font-bold text-emerald-600">{shopInfo.bankAccount?.accountNumber || 'N/A'}</span></p>
                            <p><strong>Amount:</strong> <span className="font-bold text-emerald-600">{totalAmount.toLocaleString('vi-VN')}đ</span></p>
                        </div>
                    </div>
                )}
                {selectedPaymentMethod?.type === 'BankTransfer' && !qrCodeUrl && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm mb-8">
                        <h3 className="font-bold text-xl mb-4">Payment Instructions</h3>
                        <p className="text-slate-600 mb-6">Please transfer the total amount to the following bank account:</p>
                        <div className="text-left bg-slate-50 p-6 rounded-xl space-y-3">
                            <p><strong>Bank:</strong> {shopInfo.bankAccount?.bankName || 'N/A'}</p>
                            <p><strong>Account Name:</strong> {shopInfo.bankAccount?.accountHolder || 'N/A'}</p>
                            <p><strong>Account Number:</strong> <span className="font-mono font-bold text-emerald-600">{shopInfo.bankAccount?.accountNumber || 'N/A'}</span></p>
                            <p><strong>Amount:</strong> <span className="font-bold text-emerald-600">{totalAmount.toLocaleString('vi-VN')}đ</span></p>
                            <p><strong>Transfer Note:</strong> <span className="font-mono bg-yellow-100 px-2 py-1">ORDER {orderId.substring(0, 8)}</span></p>
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => router.push(`/${shopSlug}/all-products`)}
                    className="bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
            
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input 
                                    required type="email" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.email}
                                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                <input 
                                    required type="tel" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.phone}
                                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">First Name</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.firstName}
                                    onChange={e => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Last Name</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.lastName}
                                    onChange={e => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Address</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.address}
                                    onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">City / Province</label>
                                <input 
                                    required type="text" 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={customerInfo.city}
                                    onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Order Notes (Optional)</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    rows={3}
                                    value={customerInfo.note}
                                    onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                        <div className="space-y-4">
                            {paymentMethods.length === 0 ? (
                                <div className="text-slate-500">No payment methods available.</div>
                            ) : (
                                paymentMethods.map(pm => (
                                    <label key={pm.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethodId === pm.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input 
                                            type="radio" 
                                            name="payment" 
                                            value={pm.id} 
                                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                                            checked={paymentMethodId === pm.id}
                                            onChange={() => setPaymentMethodId(pm.id)}
                                        />
                                        <span className="ml-4 font-medium">{pm.name}</span>
                                        {pm.description && <span className="ml-2 text-sm text-slate-500">({pm.description})</span>}
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3">
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sticky top-6">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>
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
                                        <div className="text-slate-500 text-sm mt-1">{(item.price).toLocaleString('vi-VN')}đ</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4 mb-6">
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Discount Code</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                                    placeholder="Enter code"
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
                                    {validatingCoupon ? '...' : 'Apply'}
                                </button>
                            </div>
                            {couponStatus && (
                                <div className={`text-sm mt-2 ${couponStatus.valid ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {couponStatus.message}
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4 space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {couponStatus?.valid && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount ({couponCode})</span>
                                    <span>-{couponStatus.discount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl pt-3 border-t border-slate-200">
                                <span>Total</span>
                                <span className="text-emerald-600">{Math.max(0, totalAmount - (couponStatus?.discount || 0)).toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || paymentMethods.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin text-xl">◌</span> Processing...
                                </span>
                            ) : (
                                `Pay ${Math.max(0, totalAmount - (couponStatus?.discount || 0)).toLocaleString('vi-VN')}đ`
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
