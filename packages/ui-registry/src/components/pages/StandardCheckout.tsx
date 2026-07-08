'use client';

import React from 'react';
import { CheckoutDefault } from '../cart/CheckoutDefault';
import { formatPrice } from '../../lib/format';

interface StandardCheckoutProps {
    shopInfo?: any;
    shopSlug?: string;
}

/**
 * StandardCheckout is kept in the component registry for master-template
 * layouts, but it now delegates to the single, real checkout implementation
 * (CheckoutDefault) instead of maintaining a second, divergent checkout that
 * posted to a stale API contract. This keeps one working checkout everywhere.
 *
 * Without shopInfo/shopSlug (i.e. inside the builder canvas, where there is no
 * real cart/session) it renders a static mock instead: CheckoutDefault would
 * otherwise fetch payment methods and redirect away when the cart is empty.
 */
export function StandardCheckout({ shopInfo, shopSlug }: StandardCheckoutProps) {
    if (!shopInfo || !shopSlug) return <CheckoutPreviewMock />;
    return <CheckoutDefault shopInfo={shopInfo} shopSlug={shopSlug} />;
}

function CheckoutPreviewMock() {
    const field = (label: string, wide = false) => (
        <div className={wide ? 'col-span-2' : ''}>
            <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
            <div className="h-10 rounded-lg border border-slate-200 bg-slate-50" />
        </div>
    );
    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl pointer-events-none select-none">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Thanh toán</h1>
            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3 space-y-6">
                    <div className="rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-800 mb-4">Thông tin liên hệ</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {field('Email', true)}
                            {field('Họ')}
                            {field('Tên')}
                            {field('Số điện thoại', true)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-800 mb-4">Vận chuyển</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {field('Địa chỉ', true)}
                            {field('Tỉnh / Thành phố', true)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-800 mb-4">Phương thức thanh toán</h2>
                        <div className="space-y-2">
                            <div className="h-10 rounded-lg border border-slate-200 bg-slate-50" />
                            <div className="h-10 rounded-lg border border-slate-200 bg-slate-50" />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="rounded-2xl border border-slate-200 p-6 space-y-3">
                        <h2 className="font-semibold text-slate-800">Tóm tắt đơn hàng</h2>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Tổng phụ</span><span>{formatPrice(499000)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Vận chuyển</span><span>Miễn phí</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-3">
                            <span>Tổng cộng</span><span>{formatPrice(499000)}</span>
                        </div>
                        <div className="h-11 rounded-lg bg-slate-900/80 text-white flex items-center justify-center text-sm font-medium">
                            Thanh toán
                        </div>
                        <p className="text-xs text-slate-400 text-center">
                            Bản xem trước — khách sẽ thấy giỏ hàng thật của họ ở đây.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
