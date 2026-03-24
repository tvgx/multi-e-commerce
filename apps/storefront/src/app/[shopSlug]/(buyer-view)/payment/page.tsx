'use client';

import React, { useState, useEffect, use } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = use(params);
    const router = useRouter();
    const { items, totalAmount, clearCart, shopId, sessionId } = useCartStore();

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        shippingAddress: '',
        paymentMethod: 'COD',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (items.length === 0 && !loading) {
            router.push(`/${shopSlug}/all-products`);
        }
    }, [items, loading, router, shopSlug]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (!shopId) return setError('Shop ID is missing. Please clear cookies and refresh.');
        if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
            return setError('Please fill in all required fields (Name, Email, Address).');
        }

        setLoading(true);
        setError('');

        try {
            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${getApiUrl()}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    shopId,
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    shippingAddress: formData.shippingAddress,
                    paymentProvider: formData.paymentMethod,
                    items: items.map((i) => ({
                        productId: i.productId,
                        variantId: i.variantId,
                        quantity: i.quantity,
                        price: i.price,
                    })),
                    totalAmount,
                }),
            });

            const data = await res.json();
            if (data.code === '1000') {
                await clearCart();
                // Redirect to a success page or just an alert for now
                alert('Order placed successfully! Order ID: ' + data.data.id);
                router.push(`/${shopSlug}`);
            } else {
                setError(data.message || 'Failed to place order');
            }
        } catch (err) {
            setError('An error occurred while placing the order.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) return null; // Prevent flicker before redirect

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-center text-slate-900">Checkout</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-medium text-center border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Shipping Details</h2>
                        <div className="space-y-4">
                            <input 
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                                placeholder="Full Name *" 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    name="customerEmail"
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                                    placeholder="Email Address *" 
                                />
                                <input 
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                                    placeholder="Phone Number" 
                                />
                            </div>
                            <textarea 
                                name="shippingAddress"
                                value={formData.shippingAddress}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                placeholder="Full Delivery Address *" 
                                rows={3}
                            ></textarea>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Payment Method</h2>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <input 
                                    type="radio" 
                                    name="paymentGroup" 
                                    checked={formData.paymentMethod === 'CARD'}
                                    onChange={() => setFormData({...formData, paymentMethod: 'CARD'})}
                                    className="accent-emerald-500 w-4 h-4" 
                                /> 
                                <span className="font-medium text-slate-700">Credit/Debit Card (Mock)</span>
                            </label>
                            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'COD' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <input 
                                    type="radio" 
                                    name="paymentGroup" 
                                    checked={formData.paymentMethod === 'COD'}
                                    onChange={() => setFormData({...formData, paymentMethod: 'COD'})}
                                    className="accent-emerald-500 w-4 h-4" 
                                /> 
                                <span className="font-medium text-slate-700">Cash on Delivery (COD)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="lg:pl-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Order Summary</h2>
                        
                        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                            {items.map(item => (
                                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-lg overflow-hidden shrink-0">
                                        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <h4 className="font-bold text-slate-800 line-clamp-2">{item.title}</h4>
                                        <p className="text-slate-500 mt-1">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-bold text-slate-900">
                                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 text-sm border-t border-slate-200 pt-6 mb-6 text-slate-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="text-emerald-600 font-medium">Free</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-2xl mb-8 text-slate-900 border-t border-slate-200 pt-6">
                            <span>Total</span>
                            <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? 'Processing...' : `Pay ${totalAmount.toLocaleString('vi-VN')}đ`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
