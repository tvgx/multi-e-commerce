'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Minus, Plus, Trash2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { SmartImage } from '../blocks/SmartImage';
import { usePriceFormatter } from '../../lib/use-price';

interface CartItem {
    id: string;
    productId: string;
    name: string;
    variant: string;
    price: number;
    quantity: number;
    image: string;
}

interface StandardCartProps {
    items?: CartItem[];
}

export function StandardCart({ items = [] }: StandardCartProps) {
    const params = useParams();
    const shopSlug = (params?.shopSlug as string) || '';
    const formatPrice = usePriceFormatter();

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 10 : 0;
    const taxes = subtotal * 0.05;
    const total = subtotal + shipping + taxes;

    return (
        <div className="w-full bg-slate-50 min-h-screen pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">
                
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center md:text-left">Your Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <span className="text-6xl text-slate-300">🛒</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Browse our products and discover great deals.</p>
                        <a href={`/${shopSlug}/all-products`} className="bg-brand text-white px-8 py-4 rounded-xl font-medium hover:bg-brand/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                            Start Shopping <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left: Cart Items */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-slate-50/50 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-6">Product</div>
                                    <div className="col-span-3 text-center">Quantity</div>
                                    <div className="col-span-3 text-right">Total</div>
                                </div>
                                
                                <div className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center group">
                                            {/* Product Details */}
                                            <div className="col-span-1 md:col-span-6 flex gap-4 items-center">
                                                <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                                                    {item.image ? (
                                                        <SmartImage src={item.image} alt={item.name} className="w-full h-full object-cover" sizes="96px" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.name}</h3>
                                                    {item.variant && <span className="text-sm text-slate-500 mb-2">Variant: {item.variant}</span>}
                                                    <div className="text-primary font-medium">{formatPrice(item.price)}</div>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center items-center">
                                                <div className="flex items-center w-28 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                    <button className="w-8 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <div className="flex-1 text-center font-medium text-slate-900 text-sm">{item.quantity}</div>
                                                    <button className="w-8 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Total & Remove */}
                                            <div className="col-span-1 md:col-span-3 flex justify-between md:justify-end items-center gap-4">
                                                <div className="font-bold text-slate-900 text-lg md:text-right block md:hidden">Total: {formatPrice((item.price * item.quantity))}</div>
                                                <div className="font-bold text-slate-900 text-lg text-right hidden md:block">{formatPrice((item.price * item.quantity))}</div>
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remove item">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sticky top-6">
                                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                                
                                <div className="space-y-4 text-slate-600 mb-6">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span className="font-medium text-slate-900">{formatPrice(shipping)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Estimated Taxes</span>
                                        <span className="font-medium text-slate-900">{formatPrice(taxes)}</span>
                                    </div>
                                </div>
                                
                                <hr className="border-slate-100 mb-6" />
                                
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-3xl font-black text-slate-900">{formatPrice(total)}</span>
                                </div>

                                <a href={`/${shopSlug}/payment`} className="w-full block text-center bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:bg-brand/90 transition-all flex justify-center items-center gap-2 mb-6">
                                    Proceed to Checkout <ArrowRight className="w-5 h-5" />
                                </a>

                                {/* Trust Badges */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <ShieldCheck className="w-5 h-5 text-brand" /> Secure Checkout
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <CreditCard className="w-5 h-5 text-blue-500" /> Multiple Payment Options
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
