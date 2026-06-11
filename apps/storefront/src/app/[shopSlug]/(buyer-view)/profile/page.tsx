import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMyOrders, getShopInfo, getMyProfile } from '@/lib/api/storefront.api';

const SHIPMENT_STATE_LABELS: Record<string, string> = {
    pending: 'Chờ xử lý',
    ready: 'Sẵn sàng giao',
    shipped: 'Đang giao hàng',
    delivered: 'Đã giao',
    returned: 'Đã hoàn trả',
    canceled: 'Đã huỷ',
};

export default async function ProfilePage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;
    
    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

    if (!token) {
        redirect(`/${shopSlug}/account/login`);
    }

    const shopInfo = await getShopInfo(shopSlug);
    const profile = await getMyProfile(shopSlug, token);
    const orders = await getMyOrders(shopSlug, token);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Your Account</h1>
                <div className="flex items-center gap-6">
                <Link
                    href={`/${shopSlug}/wallet`}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                >
                    Ví của tôi →
                </Link>
                <form action={async () => {
                    'use server';
                    const cs = await cookies();
                    cs.delete(`shop_session_${shopSlug}`);
                    redirect(`/${shopSlug}/account/login`);
                }}>
                    <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                        Sign Out
                    </button>
                </form>
                </div>
            </div>

            {profile && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Profile Info</h2>
                    <div className="space-y-2 text-slate-600">
                        <p><span className="font-medium text-slate-800">Name:</span> {profile.name || 'Not set'}</p>
                        <p><span className="font-medium text-slate-800">Email:</span> {profile.email}</p>
                        <p><span className="font-medium text-slate-800">Member since:</span> {new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Order History</h2>
                {(!orders || orders.length === 0) && (
                    <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-200">
                        You haven't placed any orders yet.
                </div>
            )}

            {orders && orders.length > 0 && (
                <div className="space-y-6">
                    {orders.map((order: any) => (
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

                            {/* Shipment tracking */}
                            {order.shipments && order.shipments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    {order.shipments.map((shipment: any) => (
                                        <div key={shipment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                shipment.state === 'delivered' ? 'bg-emerald-100 text-emerald-700'
                                                : shipment.state === 'shipped' ? 'bg-purple-100 text-purple-700'
                                                : shipment.state === 'canceled' || shipment.state === 'returned' ? 'bg-red-100 text-red-600'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {SHIPMENT_STATE_LABELS[shipment.state] || shipment.state}
                                            </span>
                                            {order.shippingMethod?.name && (
                                                <span className="text-slate-500">{order.shippingMethod.name}</span>
                                            )}
                                            {shipment.carrier && (
                                                <span className="text-slate-600">
                                                    {shipment.carrier}
                                                    {shipment.trackingNumber && (
                                                        <> · Mã vận đơn: <span className="font-mono font-medium text-slate-800">{shipment.trackingNumber}</span></>
                                                    )}
                                                </span>
                                            )}
                                            {shipment.shippedAt && (
                                                <span className="text-slate-400 text-xs">
                                                    Gửi: {new Date(shipment.shippedAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                            {shipment.deliveredAt && (
                                                <span className="text-slate-400 text-xs">
                                                    Giao: {new Date(shipment.deliveredAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
