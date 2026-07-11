'use client';

import React from 'react';
import Link from 'next/link';
import { usePriceFormatter } from '../../lib/use-price';
import { useTranslations, useLocale } from '@ecommerce/i18n/src/react';
import { OrderActions } from '../account/OrderActions';

interface StandardProfileProps {
    shopSlug?: string;
    profile?: { name?: string; email?: string; createdAt?: string } | null;
    orders?: any[] | null;
    // Server action bound by the storefront route; absent in the builder canvas.
    signOutAction?: () => Promise<void>;
}

/**
 * Buyer account page: profile info + order history with per-order actions.
 * Rendered by the storefront /profile route through the layout engine; the
 * route fetches profile/orders server-side (session cookie) and passes them
 * via pageContext. Without shopSlug (builder canvas) it renders a static mock.
 */
export function StandardProfile({ shopSlug, profile, orders, signOutAction }: StandardProfileProps) {
    if (!shopSlug) return <ProfilePreviewMock />;
    return (
        <ProfileView
            shopSlug={shopSlug}
            profile={profile ?? null}
            orders={orders ?? []}
            signOutAction={signOutAction}
        />
    );
}

function ProfileView({ shopSlug, profile, orders, signOutAction }: {
    shopSlug: string;
    profile: { name?: string; email?: string; createdAt?: string } | null;
    orders: any[];
    signOutAction?: () => Promise<void>;
}) {
    const t = useTranslations('auth');
    const tc = useTranslations('common');
    const to = useTranslations('order');
    const locale = useLocale();
    const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
    const formatPrice = usePriceFormatter();

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">{t('profile.accountTitle')}</h1>
                <div className="flex items-center gap-6">
                    <Link
                        href={`/${shopSlug}/wallet`}
                        className="text-sm font-bold text-brand hover:text-brand"
                    >
                        {tc('nav.myWallet')} →
                    </Link>
                    {signOutAction && (
                        <form action={signOutAction}>
                            <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                                {tc('buttons.signOut')}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {profile && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">{t('profile.infoTitle')}</h2>
                    <div className="space-y-2 text-slate-600">
                        <p><span className="font-medium text-slate-800">{t('profile.nameLabel')}:</span> {profile.name || tc('messages.notSet')}</p>
                        <p><span className="font-medium text-slate-800">{t('profile.email')}:</span> {profile.email}</p>
                        <p><span className="font-medium text-slate-800">{t('profile.memberSince')}:</span> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(intlLocale) : ''}</p>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">{to('orders.history')}</h2>
                {(!orders || orders.length === 0) && (
                    <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-200">
                        {to('orders.noneYet')}
                    </div>
                )}

                {orders && orders.length > 0 && (
                    <div className="space-y-6">
                        {orders.map((order: any) => (
                            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 mb-4 gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">{to('orders.orderLabel')} #{order.number}</h2>
                                        <p className="text-sm text-slate-500">
                                            {new Date(order.createdAt).toLocaleDateString(intlLocale)} — {new Date(order.createdAt).toLocaleTimeString(intlLocale)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-brand">
                                            {formatPrice(order.totalAmount)}
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
                                                <p className="text-sm text-slate-500">{to('orders.qty')}: {item.quantity}</p>
                                            </div>
                                            <div className="font-medium text-slate-900">
                                                {formatPrice((item.price * item.quantity))}
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
                                                    shipment.state === 'delivered' ? 'bg-brand/10 text-brand'
                                                    : shipment.state === 'shipped' ? 'bg-purple-100 text-purple-700'
                                                    : shipment.state === 'canceled' || shipment.state === 'returned' ? 'bg-red-100 text-red-600'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {to(`shipmentStates.${shipment.state}`, { defaultValue: shipment.state })}
                                                </span>
                                                {order.shippingMethod?.name && (
                                                    <span className="text-slate-500">{order.shippingMethod.name}</span>
                                                )}
                                                {shipment.carrier && (
                                                    <span className="text-slate-600">
                                                        {shipment.carrier}
                                                        {shipment.trackingNumber && (
                                                            <> · {to('tracking.trackingLabel')}: <span className="font-mono font-medium text-slate-800">{shipment.trackingNumber}</span></>
                                                        )}
                                                    </span>
                                                )}
                                                {shipment.shippedAt && (
                                                    <span className="text-slate-400 text-xs">
                                                        {to('tracking.shippedLabel')}: {new Date(shipment.shippedAt).toLocaleDateString(intlLocale)}
                                                    </span>
                                                )}
                                                {shipment.deliveredAt && (
                                                    <span className="text-slate-400 text-xs">
                                                        {to('tracking.deliveredLabel')}: {new Date(shipment.deliveredAt).toLocaleDateString(intlLocale)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <OrderActions shopSlug={shopSlug} order={order} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfilePreviewMock() {
    const formatPrice = usePriceFormatter();
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12 pointer-events-none select-none">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Tài khoản của tôi</h1>
                <span className="text-sm font-medium text-slate-500">Đăng xuất</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Thông tin tài khoản</h2>
                <div className="space-y-2 text-slate-600">
                    <p><span className="font-medium text-slate-800">Họ tên:</span> Nguyễn Văn A</p>
                    <p><span className="font-medium text-slate-800">Email:</span> khach@example.com</p>
                    <p><span className="font-medium text-slate-800">Thành viên từ:</span> {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử đơn hàng</h2>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 mb-4 gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Đơn hàng #1024</h2>
                            <p className="text-sm text-slate-500">Đơn hàng minh hoạ để xem trước giao diện</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-brand">{formatPrice(499000)}</div>
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium uppercase tracking-wider mt-2">
                                complete
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <p className="font-medium text-slate-800">Sản phẩm minh hoạ</p>
                            <p className="text-sm text-slate-500">Số lượng: 1</p>
                        </div>
                        <div className="font-medium text-slate-900">{formatPrice(499000)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
