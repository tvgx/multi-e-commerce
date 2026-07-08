'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, ShoppingBag, ShoppingCart, User, LogIn, Heart, Package } from 'lucide-react';

interface ShopQuickNavProps {
    shopSlug: string;
    /** true khi buyer đã đăng nhập (layout đọc session server-side). */
    loggedIn: boolean;
}

/**
 * Menu điều hướng nổi, LUÔN hiển thị trên mọi shop bất kể layout JSON có Header
 * hay không — bảo hiểm để người mua luôn tới được trang chủ / sản phẩm / giỏ
 * hàng / đăng nhập / đơn hàng, kể cả trên shop chưa thiết kế section nào.
 */
export function ShopQuickNav({ shopSlug, loggedIn }: ShopQuickNavProps) {
    const [open, setOpen] = useState(false);
    const base = `/${shopSlug}`;

    const items = [
        { href: base, label: 'Trang chủ', icon: Home },
        { href: `${base}/all-products`, label: 'Tất cả sản phẩm', icon: ShoppingBag },
        { href: `${base}/cart`, label: 'Giỏ hàng', icon: ShoppingCart },
        ...(loggedIn
            ? [
                  { href: `${base}/profile`, label: 'Tài khoản & đơn hàng', icon: Package },
                  { href: `${base}/wishlist`, label: 'Yêu thích', icon: Heart },
              ]
            : [{ href: `${base}/account/login`, label: 'Đăng nhập / Đăng ký', icon: LogIn }]),
    ];

    return (
        <div className="fixed bottom-5 left-5 z-[60] flex flex-col items-start gap-2">
            {open && (
                <nav className="mb-1 min-w-[220px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors"
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-brand transition-colors"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                {!loggedIn && !open && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand ring-2 ring-white" aria-hidden="true">
                        <User className="hidden" />
                    </span>
                )}
            </button>
        </div>
    );
}
