'use client';

import React, { useState, use } from 'react';
import { getCustomerOrders } from '@/lib/api/storefront.api';

export default function ProfilePage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = use(params);
    const [email, setEmail] = useState('');
    const [orders, setOrders] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setSearched(true);
        const fetchedOrders = await getCustomerOrders(shopSlug, email);
        setOrders(fetchedOrders);
        setLoading(false);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-center text-slate-900">Your Orders</h1>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email to find orders"
                        className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        required
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Find Orders'}
                    </button>
                </form>
            </div>

            {searched && !loading && orders?.length === 0 && (
                <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-200">
                    No orders found for this email in this store.
                </div>
            )}

            {orders && orders.length > 0 && (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 mb-4 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Order #{order.number}</h2>
                                    <p className="text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-emerald-600">
                                        {order.totalAmount.toLocaleString('vi-VN')}đ
                                    </div>
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium uppercase tracking-wider mt-2">
                                        {order.state}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {order.lineItems?.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800 line-clamp-1">{item.variant?.product?.name}</p>
                                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="font-medium text-slate-900">
                                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
