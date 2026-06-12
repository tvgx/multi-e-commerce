'use client';

import React, { useState, useEffect } from 'react';
import { Lock, CreditCard, Wallet, Truck, CheckCircle, ChevronLeft, Info, X, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cart-store';
// Note: We use dynamic import for router in a registry component
import { useRouter } from 'next/navigation';
import { SmartImage } from '../blocks/SmartImage';
import { formatPrice } from '../../lib/format';
import { toast } from '../../store/toast-store';

interface StandardCheckoutProps {
    shopInfo?: any;
    shopSlug?: string;
}

export function StandardCheckout({ shopInfo, shopSlug }: StandardCheckoutProps) {
    const router = useRouter();
    const { items, totalAmount, clearCart, shopId, sessionId } = useCartStore();

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        shippingAddress: '',
        paymentMethod: 'COD',
    });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Modal states
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showCODConfirm, setShowCODConfirm] = useState(false);

    // Shipping
    const [shippingCost, setShippingCost] = useState(10); // 10 for standard, 25 for express
    const taxes = totalAmount * 0.05;
    const finalTotal = totalAmount + shippingCost + taxes;

    useEffect(() => {
        if (items.length === 0 && !loading && !showQRModal && shopSlug) {
            router.push(`/${shopSlug}/all-products`);
        }
    }, [items, loading, router, shopSlug, showQRModal]);

    useEffect(() => {
        const fetchShopSettings = async () => {
            const currentShopId = shopId || shopInfo?.id;
            if (!currentShopId) return;
            try {
                const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${getApiUrl()}/api/shops/${currentShopId}`);
                const data = await res.json();
                if (data.success && data.data.paymentMethods) {
                    setPaymentMethods(data.data.paymentMethods);
                    const activeMethods = data.data.paymentMethods.filter((m: any) => m.active);
                    if (activeMethods.length > 0) {
                        setFormData(prev => ({ ...prev, paymentMethod: activeMethods[0].type }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch payment methods", err);
            }
        };
        fetchShopSettings();
    }, [shopId, shopInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const currentShopId = shopId || shopInfo?.id;
        if (!currentShopId) {
            setError('Shop ID is missing. Please refresh.');
            return false;
        }
        if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
            setError('Please fill out all required fields (Name, Email, Address).');
            return false;
        }
        return true;
    }

    const submitOrder = async () => {
        setLoading(true);
        setError('');

        try {
            const currentShopId = shopId || shopInfo?.id;
            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${getApiUrl()}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId || '',
                    'x-shop-id': currentShopId || '',
                },
                body: JSON.stringify({
                    shopId: currentShopId,
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
                    totalAmount: finalTotal,
                }),
            });

            const data = await res.json();
            if (data.success) {
                const orderData = data.data;
                
                if (formData.paymentMethod === 'ONLINE_BANKING_QR' && orderData.paymentIntent?.qrCode) {
                    setQrData(orderData.paymentIntent);
                    setShowQRModal(true);
                    await clearCart();
                } else {
                    await clearCart();
                    toast.success('Order placed successfully! Order ID: ' + orderData.number);
                    router.push(`/${shopSlug || ''}`);
                }
            } else {
                setError(data.message || 'Error placing order');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckoutClick = () => {
        if (!validate()) return;
        
        if (formData.paymentMethod === 'COD') {
            setShowCODConfirm(true);
        } else {
            submitOrder();
        }
    };

    if (items.length === 0 && !showQRModal) return null;

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-12">
            <div className="bg-white border-b border-slate-200 py-6 mb-8">
                <div className="container mx-auto px-4 max-w-6xl flex justify-between items-center">
                    <a href="/" className="text-2xl font-black tracking-tighter text-slate-900">{shopInfo?.name || 'STORE LOGO'}</a>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Lock className="w-4 h-4" />
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-bold flex items-center gap-3 border border-red-100">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12 flex-col-reverse lg:flex-row">
                    {/* Left: Forms */}
                    <div className="w-full lg:w-3/5 space-y-8">
                        {/* 1. Contact Info */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm">1</span>
                                Contact Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                    <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Enter your email" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                    <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Enter your phone" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm">2</span>
                                Shipping Address
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                    <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                                    <input type="text" name="shippingAddress" value={formData.shippingAddress} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none" placeholder="Street address, P.O. box, etc." />
                                </div>
                            </div>
                        </div>

                        {/* 3. Shipping Method */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm">3</span>
                                Shipping Method
                            </h2>
                            <div className="space-y-3">
                                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingCost === 10 ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" checked={shippingCost === 10} onChange={() => setShippingCost(10)} className="w-5 h-5 text-primary focus:ring-primary" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">Standard Shipping</span>
                                            <span className="text-sm text-slate-500">3-5 business days</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">$10.00</span>
                                </label>
                                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingCost === 25 ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" checked={shippingCost === 25} onChange={() => setShippingCost(25)} className="w-5 h-5 text-primary focus:ring-primary" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">Express Shipping</span>
                                            <span className="text-sm text-slate-500">1-2 business days</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">$25.00</span>
                                </label>
                            </div>
                        </div>

                        {/* 4. Payment */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm">4</span>
                                Payment
                            </h2>
                            
                            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                                {paymentMethods.length > 0 ? paymentMethods.map(method => (
                                    <label key={method.id} className={`flex items-center gap-3 p-5 cursor-pointer transition-colors ${formData.paymentMethod === method.type ? 'bg-primary/5' : 'bg-slate-50'}`}>
                                        <input type="radio" checked={formData.paymentMethod === method.type} onChange={() => setFormData({...formData, paymentMethod: method.type})} className="w-5 h-5 text-primary focus:ring-primary" />
                                        {method.type === 'ONLINE_BANKING_QR' ? <Wallet className="w-5 h-5 text-slate-600" /> : <Truck className="w-5 h-5 text-slate-600" />}
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{method.name}</span>
                                            <span className="text-xs text-slate-500">{method.description}</span>
                                        </div>
                                    </label>
                                )) : (
                                    <div className="p-6 text-center text-slate-500">Loading payment methods...</div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4">
                            <a href={`/${shopSlug}/cart`} className="flex items-center gap-2 text-primary font-medium hover:underline p-2">
                                <ChevronLeft className="w-4 h-4" /> Return to Cart
                            </a>
                            <button onClick={handleCheckoutClick} disabled={loading} className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 px-12 py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Place Order <CheckCircle className="w-5 h-5" /></>}
                            </button>
                        </div>
                    </div>

                    {/* Right: Order Summary Sidebar */}
                    <div className="w-full lg:w-2/5">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sticky top-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 mb-8">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                                {item.imageUrl ? <SmartImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" sizes="64px" /> : <div className="w-full h-full flex items-center justify-center text-xl text-slate-300">📦</div>}
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-900 text-sm leading-tight">{item.title}</h4>
                                        </div>
                                        <div className="font-semibold text-slate-900">
                                            {formatPrice((item.price * item.quantity))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <hr className="border-slate-100 mb-6" />
                            
                            <div className="space-y-3 text-slate-600 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-900">{formatPrice(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-900">{formatPrice(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Taxes</span>
                                    <span className="font-medium text-slate-900">{formatPrice(taxes)}</span>
                                </div>
                            </div>
                            
                            <hr className="border-slate-100 mb-6" />
                            
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-900">Total</span>
                                <span className="text-3xl font-black text-slate-900">{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR CODE MODAL */}
            {showQRModal && qrData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm">
                    <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
                        <button onClick={() => { setShowQRModal(false); router.push(`/${shopSlug}`); }} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                        <h3 className="text-2xl font-bold">Scan to Pay</h3>
                        <div className="relative mx-auto w-64 h-64 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                            <img src={qrData.qrCode} alt="Payment QR" className="w-full h-full object-contain" />
                        </div>
                        <a href={qrData.paymentUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
                            Open Payment Link
                        </a>
                    </div>
                </div>
            )}

            {/* COD CONFIRM MODAL */}
            {showCODConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto"><Truck size={32} /></div>
                        <h3 className="text-2xl font-bold">Confirm Order?</h3>
                        <p className="text-slate-500">You will pay <span className="font-bold text-black">{formatPrice(finalTotal)}</span> upon delivery.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setShowCODConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={() => { setShowCODConfirm(false); submitOrder(); }} className="py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
